import fs from "fs";
import path from "path";
import { storage } from "./storage";

interface AdminKeyEntry {
  displayName: string;
  keyValue: string;
}

export function parseAdminKeysFile(filePath: string): AdminKeyEntry[] {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Admin keys file not found: ${filePath}`);
      return [];
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const adminKeys: AdminKeyEntry[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse format: "DisplayName - KeyValue"
      const parts = trimmed.split(' - ');
      if (parts.length === 2) {
        const displayName = parts[0].trim();
        const keyValue = parts[1].trim();
        
        if (displayName && keyValue) {
          adminKeys.push({ displayName, keyValue });
        }
      } else {
        console.warn(`Invalid admin key format in line: ${line}`);
      }
    }

    return adminKeys;
  } catch (error) {
    console.error('Error reading admin keys file:', error);
    return [];
  }
}

export async function syncAdminKeysFromFile(filePath: string = './admin-keys.txt'): Promise<void> {
  try {
    console.log('Syncing admin keys from file...');
    
    const fileKeys = parseAdminKeysFile(filePath);
    if (fileKeys.length === 0) {
      console.log('No admin keys found in file');
      return;
    }

    // Get existing keys from database
    const existingKeys = await storage.getAllAdminKeys();
    const existingKeyValues = new Set(existingKeys.map(k => k.keyValue));

    // Add new keys from file that don't exist in database
    let addedCount = 0;
    for (const fileKey of fileKeys) {
      if (!existingKeyValues.has(fileKey.keyValue)) {
        try {
          await storage.createAdminKey({
            keyValue: fileKey.keyValue,
            displayName: fileKey.displayName,
            keyName: fileKey.displayName.toLowerCase().replace(/\s+/g, '_'),
          });
          addedCount++;
          console.log(`Added admin key: ${fileKey.displayName} (${fileKey.keyValue})`);
        } catch (error) {
          console.error(`Failed to add admin key ${fileKey.keyValue}:`, error);
        }
      }
    }

    console.log(`Admin key sync complete. Added ${addedCount} new keys.`);
  } catch (error) {
    console.error('Error syncing admin keys from file:', error);
  }
}

// Auto-sync on file changes (optional, for development)
export function watchAdminKeysFile(filePath: string = './admin-keys.txt'): void {
  if (fs.existsSync(filePath)) {
    fs.watchFile(filePath, { interval: 2000 }, () => {
      console.log('Admin keys file changed, syncing...');
      syncAdminKeysFromFile(filePath);
    });
  }
}