/**
 * FileHandlerService - Handles file upload/download operations
 */
export class FileHandlerService {
  /**
   * Download file to user's device
   */
  static downloadFile(data: Blob, filename: string): void {
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate filename with timestamp
   */
  static generateExportFilename(moduleType: string, timestamp = new Date()): string {
    const date = timestamp.toISOString().split('T')[0];
    const time = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    const type = {
      flows: 'flows',
      messages: 'messages',
      routing: 'routing',
    }[moduleType];

    if (!type) {
      throw new Error(`Unknown module type: ${moduleType}`);
    }

    return `${type}-export-${date}-${time}.json`;
  }

  /**
   * Validate file is valid JSON
   */
  static async validateJsonFile(file: File): Promise<boolean> {
    try {
      const text = await this.readFileAsText(file);
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in MB
   */
  static getFileSizeInMB(file: File): number {
    return file.size / (1024 * 1024);
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}
