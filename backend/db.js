import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

// Make sure the data directory exists
try {
  await fs.mkdir(DATA_DIR, { recursive: true });
} catch (err) {
  console.error('Failed to create data directory:', err);
}

class Collection {
  constructor(name) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.name = name;
  }

  async _read() {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create it with empty array
        await fs.writeFile(this.filePath, JSON.stringify([]), 'utf8');
        return [];
      }
      throw error;
    }
  }

  async _write(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  // Matches item with standard query: { field: val, 'nested.field': val }
  _matches(item, query) {
    for (const key in query) {
      const queryVal = query[key];
      
      // Handle operators like $ne, $in, $gt
      if (queryVal && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
        if ('$ne' in queryVal && item[key] === queryVal['$ne']) return false;
        if ('$in' in queryVal && !queryVal['$in'].includes(item[key])) return false;
        if ('$gt' in queryVal && !(item[key] > queryVal['$gt'])) return false;
        if ('$lt' in queryVal && !(item[key] < queryVal['$lt'])) return false;
      } else {
        // Dot notation or direct matching
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = item;
          for (const part of parts) {
            current = current ? current[part] : undefined;
          }
          if (current !== queryVal) return false;
        } else {
          if (item[key] !== queryVal) return false;
        }
      }
    }
    return true;
  }

  async find(query = {}) {
    const data = await this._read();
    return data.filter(item => this._matches(item, query));
  }

  async findOne(query = {}) {
    const data = await this._read();
    return data.find(item => this._matches(item, query)) || null;
  }

  async create(doc) {
    const data = await this._read();
    const newDoc = {
      id: uuidv4(),
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.push(newDoc);
    await this._write(data);
    return newDoc;
  }

  async update(query, updateData) {
    const data = await this._read();
    let updatedCount = 0;
    const updatedDocs = [];

    const newData = data.map(item => {
      if (this._matches(item, query)) {
        updatedCount++;
        // Apply updates
        let updatedItem = { ...item };
        
        // Handle standard key-value updates and basic $set / $push
        if (updateData.$set) {
          updatedItem = { ...updatedItem, ...updateData.$set };
        } else if (updateData.$push) {
          for (const key in updateData.$push) {
            if (!Array.isArray(updatedItem[key])) {
              updatedItem[key] = [];
            }
            updatedItem[key].push(updateData.$push[key]);
          }
        } else {
          updatedItem = { ...updatedItem, ...updateData };
        }

        updatedItem.updatedAt = new Date().toISOString();
        updatedDocs.push(updatedItem);
        return updatedItem;
      }
      return item;
    });

    if (updatedCount > 0) {
      await this._write(newData);
    }
    return updatedDocs;
  }

  async delete(query) {
    const data = await this._read();
    const initialLength = data.length;
    const newData = data.filter(item => !this._matches(item, query));
    
    if (newData.length !== initialLength) {
      await this._write(newData);
      return { deletedCount: initialLength - newData.length };
    }
    return { deletedCount: 0 };
  }
}

// Database exports
export const db = {
  users: new Collection('users'),
  problems: new Collection('problems'),
  submissions: new Collection('submissions'),
  contests: new Collection('contests'),
  discussions: new Collection('discussions')
};
