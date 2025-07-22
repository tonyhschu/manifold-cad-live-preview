/**
 * DownloadPanel Web Component
 *
 * Provides a dropdown interface for exporting models in different formats.
 * Uses the Light DOM approach (no Shadow DOM).
 *
 * Updated to use V3 state management system and ExportService.
 */

import { v3Signals, v3Actions } from '../../state/v3-bridge';
import { getExportService, getModelService } from '../../services';
import type { ExportFormat } from '../../services/interfaces';

export class DownloadPanel extends HTMLElement {
  private containerElement: HTMLElement | null = null;
  private downloadButton: HTMLButtonElement | null = null;
  private dropdownMenu: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private isExporting: boolean = false;
  private isMenuOpen: boolean = false;

  constructor() {
    super();
  }

  connectedCallback() {
    // Find existing container or create it
    this.containerElement = this.querySelector('.download-container') ||
                           this.createContainerElement();

    // Wait for V3 bridge to be initialized before setting up subscriptions
    if (v3Signals.isInitialized.value) {
      this.setupSubscriptions();
    } else {
      // Subscribe to initialization signal
      const initUnsubscribe = v3Signals.isInitialized.subscribe(isInitialized => {
        if (isInitialized) {
          this.setupSubscriptions();
          initUnsubscribe(); // Unsubscribe from init signal
        }
      });
    }
  }

  private setupSubscriptions() {
    // Subscribe to both selectedModel and currentModel signals to enable/disable export
    const selectedModelUnsubscribe = v3Signals.selectedModel.subscribe(modelId => {
      this.updateExportAvailability(!!modelId && !!v3Signals.currentModel.value);
    });

    const currentModelUnsubscribe = v3Signals.currentModel.subscribe(model => {
      this.updateExportAvailability(!!v3Signals.selectedModel.value && !!model);
    });

    // Combine unsubscribe functions
    this.unsubscribe = () => {
      selectedModelUnsubscribe();
      currentModelUnsubscribe();
    };

    // Initial render
    this.renderDownloadButton();
    this.updateExportAvailability(!!v3Signals.selectedModel.value && !!v3Signals.currentModel.value);
  }
  
  disconnectedCallback() {
    
    // Clean up subscription when element is removed
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
  
  /**
   * Create the container element if it doesn't exist
   */
  private createContainerElement() {
    const container = document.createElement('div');
    container.className = 'download-container';
    this.appendChild(container);
    return container;
  }

  /**
   * Render the download button with dropdown menu
   */
  private renderDownloadButton() {
    if (!this.containerElement) return;

    // Clear existing content
    this.containerElement.innerHTML = '';

    try {
      const exportService = getExportService();
      const supportedFormats = exportService.getSupportedFormats();

      // Create download button container
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'download-button-container';

      // Create download button
      const button = document.createElement('button');
      button.textContent = 'Download';
      button.className = 'download-btn';
      button.addEventListener('click', (e) => this.toggleDropdownMenu(e));

      buttonContainer.appendChild(button);
      this.downloadButton = button;

      // Create dropdown menu
      const menu = document.createElement('div');
      menu.className = 'download-dropdown-menu';
      menu.style.display = 'none';

      // Add menu items for each supported format
      supportedFormats.forEach(format => {
        const menuItem = document.createElement('div');
        menuItem.className = 'download-menu-item';
        menuItem.textContent = `${format.name} (.${format.extension})`;
        menuItem.title = format.description;
        menuItem.addEventListener('click', () => this.handleFormatDownload(format.id));
        menu.appendChild(menuItem);
      });

      buttonContainer.appendChild(menu);
      this.dropdownMenu = menu;

      this.containerElement.appendChild(buttonContainer);

      // Close menu when clicking outside
      document.addEventListener('click', (e) => this.handleOutsideClick(e));

    } catch (error) {
      // Fallback if export service is not available
      this.renderFallbackMessage();
    }
  }

  /**
   * Render fallback message when export service is not available
   */
  private renderFallbackMessage() {
    if (!this.containerElement) return;

    this.containerElement.innerHTML = '<p class="no-export-message">Export service not available</p>';
  }

  /**
   * Update export availability based on model selection
   */
  private updateExportAvailability(hasModel: boolean) {
    if (this.downloadButton) {
      this.downloadButton.disabled = !hasModel || this.isExporting;
      this.downloadButton.textContent = this.isExporting ? 'Exporting...' : 'Download';
    }
  }

  /**
   * Toggle dropdown menu visibility
   */
  private toggleDropdownMenu(event: Event) {
    event.stopPropagation();

    if (!this.dropdownMenu || this.isExporting) return;

    this.isMenuOpen = !this.isMenuOpen;
    this.dropdownMenu.style.display = this.isMenuOpen ? 'block' : 'none';
  }

  /**
   * Handle clicks outside the dropdown to close it
   */
  private handleOutsideClick(event: Event) {
    if (!this.dropdownMenu || !this.isMenuOpen) return;

    const target = event.target as Element;
    const container = this.containerElement?.querySelector('.download-button-container');

    if (container && !container.contains(target)) {
      this.isMenuOpen = false;
      this.dropdownMenu.style.display = 'none';
    }
  }

  /**
   * Handle download for a specific format
   */
  private async handleFormatDownload(formatId: string) {
    if (this.isExporting) return;

    // Close the dropdown menu
    this.isMenuOpen = false;
    if (this.dropdownMenu) {
      this.dropdownMenu.style.display = 'none';
    }

    const selectedModelId = v3Signals.selectedModel.value;
    const currentModel = v3Signals.currentModel.value;

    if (!selectedModelId) {
      v3Actions.updateStatus('No model selected for export', true);
      return;
    }

    if (!currentModel) {
      v3Actions.updateStatus('Model not available for export', true);
      return;
    }

    this.isExporting = true;
    this.updateExportAvailability(true);

    try {
      const exportService = getExportService();

      // Export the current model in the selected format
      v3Actions.updateStatus(`Exporting to ${formatId.toUpperCase()}...`, false);

      const exportResult = await exportService.exportModel(
        currentModel,
        formatId,
        `${selectedModelId}.${formatId}`,
        (progress, message) => {
          if (message) {
            v3Actions.updateStatus(message, false);
          }
        }
      );

      // Trigger download
      const link = document.createElement('a');
      link.href = exportResult.url;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      v3Actions.updateStatus(`Export completed: ${exportResult.filename}`, false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      v3Actions.updateStatus(`Export failed: ${errorMessage}`, true);
    } finally {
      this.isExporting = false;
      this.updateExportAvailability(!!selectedModelId);
    }
  }

  disconnectedCallback() {
    // Clean up subscriptions
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Clean up document event listener
    document.removeEventListener('click', this.handleOutsideClick);
  }
}

// Register the custom element
customElements.define('download-panel', DownloadPanel);