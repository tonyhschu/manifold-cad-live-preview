// Font Resolver Prototype - Pure JavaScript, no bundlers
// Testing font loading from Google Fonts with OpenType.js

// Console logging setup
const consoleDiv = document.getElementById('console');
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function logToConsole(message, type = 'log') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        log: '#d4d4d4',
        error: '#f48771',
        warn: '#dcdcaa',
        success: '#4ec9b0',
        info: '#9cdcfe'
    };
    
    const prefix = {
        log: '📝',
        error: '❌',
        warn: '⚠️',
        success: '✅',
        info: 'ℹ️'
    }[type] || '📝';
    
    const color = colors[type] || colors.log;
    
    consoleDiv.innerHTML += `<span style="color: #569cd6">[${timestamp}]</span> <span style="color: ${color}">${prefix} ${message}</span>\n`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
    
    // Also log to browser console
    if (type === 'error') originalError(message);
    else if (type === 'warn') originalWarn(message);
    else originalLog(message);
}

// Override console methods
console.log = (message) => logToConsole(message, 'log');
console.error = (message) => logToConsole(message, 'error');
console.warn = (message) => logToConsole(message, 'warn');
console.success = (message) => logToConsole(message, 'success');
console.info = (message) => logToConsole(message, 'info');

// Font URLs - Testing different sources for TTF/OTF files
// Google Fonts only serves WOFF2, so we need alternative sources
const FONT_URLS = {
    'Roboto WOFF2 (Will Fail)': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
    'Inter Variable Font': 'https://cdn.jsdelivr.net/npm/inter-font@3.19.0/Inter-VariableFont_slnt,wght.ttf',
    'Roboto from jsDelivr': 'https://cdn.jsdelivr.net/npm/@fontsource/roboto@4.5.8/files/roboto-latin-400-normal.ttf',
    'Inter from jsDelivr': 'https://cdn.jsdelivr.net/npm/@fontsource/inter@4.5.2/files/inter-latin-400-normal.ttf'
};

// Global variables
let opentype = null;
let loadedFonts = new Map();

// Test 1: Import OpenType.js from CDN
window.testOpenTypeImport = async function() {
    console.log('=== Test 1: OpenType.js Import ===');
    try {
        console.log('Importing OpenType.js from CDN...');
        
        // Import from CDN
        const module = await import('https://cdn.skypack.dev/opentype.js');
        opentype = module.default || module;
        
        console.success('OpenType.js imported successfully');
        console.info(`OpenType.js version: ${opentype.version || 'unknown'}`);
        console.info(`Available methods: ${Object.keys(opentype).join(', ')}`);
        
        return true;
    } catch (error) {
        console.error(`OpenType.js import failed: ${error.message}`);
        return false;
    }
};

// Test 2: Direct fetch to font URLs
window.testDirectFetch = async function() {
    console.log('=== Test 2: Direct Font Fetch ===');
    
    for (const [fontName, url] of Object.entries(FONT_URLS)) {
        try {
            console.log(`Fetching ${fontName}...`);
            console.info(`URL: ${url}`);
            
            const startTime = Date.now();
            const response = await fetch(url);
            const fetchTime = Date.now() - startTime;
            
            console.log(`Response status: ${response.status} ${response.statusText}`);
            console.log(`Content-Type: ${response.headers.get('content-type')}`);
            console.log(`Content-Length: ${response.headers.get('content-length')}`);
            console.log(`Fetch time: ${fetchTime}ms`);
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                console.success(`${fontName} fetched successfully: ${arrayBuffer.byteLength} bytes`);
            } else {
                console.error(`${fontName} fetch failed: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.error(`${fontName} fetch error: ${error.message}`);
        }
        
        console.log('---');
    }
};

// Test 3: OpenType.js parsing
window.testOpenTypeParse = async function() {
    console.log('=== Test 3: OpenType.js Parse ===');
    
    if (!opentype) {
        console.error('OpenType.js not loaded. Run Test 1 first.');
        return;
    }
    
    // Test with Inter Variable Font (should be TTF and CORS-enabled)
    const fontName = 'Inter Variable Font';
    const url = FONT_URLS[fontName];
    
    try {
        console.log(`Testing OpenType.js parsing with ${fontName}...`);
        
        // Fetch font data
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.success(`Font data fetched: ${arrayBuffer.byteLength} bytes`);
        
        // Parse with OpenType.js
        const startTime = Date.now();
        const font = opentype.parse(arrayBuffer);
        const parseTime = Date.now() - startTime;
        
        console.success(`Font parsed successfully in ${parseTime}ms`);
        console.info(`Family: ${font.names.fontFamily?.en || 'Unknown'}`);
        console.info(`Subfamily: ${font.names.fontSubfamily?.en || 'Unknown'}`);
        console.info(`Glyphs: ${font.glyphs.length}`);
        console.info(`Units per EM: ${font.unitsPerEm}`);
        
        // Test glyph access
        const testChars = ['H', 'e', 'l', 'o'];
        console.log('Testing glyph access:');
        for (const char of testChars) {
            const glyph = font.charToGlyph(char);
            console.log(`  '${char}': ${glyph.name}, unicode: ${glyph.unicode}, advanceWidth: ${glyph.advanceWidth}`);
        }
        
        // Store for later use
        loadedFonts.set(fontName, font);
        console.success(`${fontName} stored in cache`);
        
    } catch (error) {
        console.error(`OpenType.js parsing failed: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
    }
};

// Test 4: Simple Font Resolver
class SimpleFontResolver {
    constructor() {
        this.cache = new Map();
    }
    
    async loadFont(fontName) {
        console.log(`FontResolver: Loading ${fontName}...`);
        
        // Check cache first
        if (this.cache.has(fontName)) {
            console.info(`FontResolver: ${fontName} found in cache`);
            return this.cache.get(fontName);
        }
        
        // Get URL
        const url = FONT_URLS[fontName];
        if (!url) {
            throw new Error(`Font '${fontName}' not found in available fonts`);
        }
        
        // Fetch font data
        console.log(`FontResolver: Fetching from ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.success(`FontResolver: Fetched ${arrayBuffer.byteLength} bytes`);
        
        // Parse with OpenType.js
        if (!opentype) {
            throw new Error('OpenType.js not loaded');
        }
        
        const font = opentype.parse(arrayBuffer);
        console.success(`FontResolver: Parsed font successfully`);
        
        // Create result object
        const result = {
            info: {
                name: fontName,
                family: font.names.fontFamily?.en || 'Unknown',
                weight: font.names.fontSubfamily?.en || 'Unknown',
                url: url
            },
            font: font,
            loadedAt: Date.now()
        };
        
        // Cache it
        this.cache.set(fontName, result);
        console.success(`FontResolver: ${fontName} cached successfully`);
        
        return result;
    }
    
    getAvailableFonts() {
        return Object.keys(FONT_URLS);
    }
}

window.testFontResolver = async function() {
    console.log('=== Test 4: Font Resolver ===');
    
    if (!opentype) {
        console.error('OpenType.js not loaded. Run Test 1 first.');
        return;
    }
    
    try {
        const resolver = new SimpleFontResolver();
        console.log('FontResolver created');
        
        const availableFonts = resolver.getAvailableFonts();
        console.info(`Available fonts: ${availableFonts.join(', ')}`);
        
        // Test loading Inter Variable Font
        const fontName = 'Inter Variable Font';
        const startTime = Date.now();
        const loadedFont = await resolver.loadFont(fontName);
        const totalTime = Date.now() - startTime;
        
        console.success(`FontResolver completed in ${totalTime}ms`);
        console.info(`Loaded: ${loadedFont.info.name}`);
        console.info(`Family: ${loadedFont.info.family}`);
        console.info(`Weight: ${loadedFont.info.weight}`);
        console.info(`Glyphs: ${loadedFont.font.glyphs.length}`);
        
        // Test caching
        console.log('Testing cache...');
        const startTime2 = Date.now();
        const cachedFont = await resolver.loadFont(fontName);
        const cacheTime = Date.now() - startTime2;
        
        console.success(`Cache retrieval: ${cacheTime}ms`);
        console.info(`Same object: ${loadedFont === cachedFont}`);
        
    } catch (error) {
        console.error(`FontResolver test failed: ${error.message}`);
        console.error(`Stack: ${error.stack}`);
    }
};

window.clearConsole = function() {
    consoleDiv.innerHTML = '';
};

// Initialize
console.log('🚀 Font Resolver Prototype initialized');
console.info(`User Agent: ${navigator.userAgent}`);
console.info(`Current URL: ${window.location.href}`);
console.log('Ready to test! Start with Test 1 to import OpenType.js.');
