import { execSync } from 'child_process';
import { existsSync } from 'fs';
export function validateProjectName(name) {
    // Check if name is empty
    if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Project name cannot be empty' };
    }
    // Check for valid npm package name characters
    const validNameRegex = /^[a-z0-9-_]+$/;
    if (!validNameRegex.test(name)) {
        return {
            valid: false,
            error: 'Project name can only contain lowercase letters, numbers, hyphens, and underscores'
        };
    }
    // Check if directory already exists
    if (existsSync(name)) {
        return {
            valid: false,
            error: `Directory "${name}" already exists`
        };
    }
    // Check for reserved names
    const reservedNames = ['node_modules', 'package', 'npm', 'test', 'src'];
    if (reservedNames.includes(name)) {
        return {
            valid: false,
            error: `"${name}" is a reserved name and cannot be used`
        };
    }
    return { valid: true };
}
export function runCommand(command, cwd) {
    try {
        execSync(command, {
            cwd,
            stdio: 'inherit',
            encoding: 'utf8'
        });
    }
    catch (error) {
        throw new Error(`Failed to run command: ${command}`);
    }
}
export function getPackageManager() {
    // For Phase 1, always use npm
    return 'npm';
}
