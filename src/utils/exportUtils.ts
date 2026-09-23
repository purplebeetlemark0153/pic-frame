/**
 * Real Export implementations for PNG, JPG, PDF, DOCX, and Project Save/Open
 * Strictly adheres to Sections 26, 27, 28, 29, 30, 31, 40.
 * NO pseudo-code, NO fake downloads, NO renaming PNG to .docx!
 */

import { Document, ImageRun, Packer, Paragraph } from 'docx';
import jsPDF from 'jspdf';
import { ProjectData } from '../types';
import { renderProjectToCanvas } from './canvasRenderer';

export const CURRENT_PROJECT_VERSION = '1.0.0';

/**
 * Reads a File as Base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Unsupported Image: Only image files are allowed.'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Image Load Failed: Could not parse image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Corrupt Image: File read error.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Downloads a Blob or data URL as a file with a given filename
 */
export function triggerDownload(blobOrUrl: Blob | string, filename: string) {
  const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

/**
 * Exports Canvas as PNG
 */
export async function exportToPNG(project: ProjectData, filename = 'layout-design.png') {
  try {
    const canvas = await renderProjectToCanvas(project, 2); // 2x high resolution
    const dataUrl = canvas.toDataURL('image/png');
    triggerDownload(dataUrl, filename);
  } catch (err: any) {
    throw new Error('Export Failed (PNG): ' + (err.message || err));
  }
}

/**
 * Exports Canvas as JPG
 * Uses specified canvas background or pure white for transparent zones
 */
export async function exportToJPG(project: ProjectData, filename = 'layout-design.jpg') {
  try {
    // If background is transparent, force white background for JPG
    const forcedBg = project.canvas.background === 'transparent' ? '#ffffff' : undefined;
    const canvas = await renderProjectToCanvas(project, 2, forcedBg);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    triggerDownload(dataUrl, filename);
  } catch (err: any) {
    throw new Error('Export Failed (JPG): ' + (err.message || err));
  }
}

/**
 * Exports Canvas as real PDF using jsPDF
 */
export async function exportToPDF(project: ProjectData, filename = 'layout-design.pdf') {
  try {
    const canvas = await renderProjectToCanvas(project, 2);
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const isLandscape = project.canvas.width > project.canvas.height;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [project.canvas.width, project.canvas.height],
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, project.canvas.width, project.canvas.height);
    pdf.save(filename);
  } catch (err: any) {
    throw new Error('PDF Failed: ' + (err.message || err));
  }
}

/**
 * Exports Canvas as real DOCX
 * Renders Canvas to high-res image and embeds into a valid Word (.docx) document
 */
export async function exportToDOCX(project: ProjectData, filename = 'layout-design.docx') {
  try {
    const canvas = await renderProjectToCanvas(project, 2);
    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))), 'image/png');
    });

    const arrayBuffer = await blob.arrayBuffer();

    // Calculate Word dimensions (max width ~ 600px for standard letter/A4 margins)
    const maxWidth = 580;
    const scale = maxWidth / project.canvas.width;
    const docWidth = maxWidth;
    const docHeight = Math.round(project.canvas.height * scale);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new ImageRun({
                  data: new Uint8Array(arrayBuffer),
                  transformation: {
                    width: docWidth,
                    height: docHeight,
                  },
                  type: 'png',
                } as any),
              ],
            }),
          ],
        },
      ],
    });

    const docxBlob = await Packer.toBlob(doc);
    triggerDownload(docxBlob, filename);
  } catch (err: any) {
    throw new Error('DOCX Failed: ' + (err.message || err));
  }
}

/**
 * Saves Project to JSON file
 * Embeds full project data with version and image sources
 */
export function saveProjectToFile(project: ProjectData, filename = 'layout-project.json') {
  try {
    const fullProject: ProjectData = {
      ...project,
      version: CURRENT_PROJECT_VERSION,
      metadata: {
        createdAt: project.metadata?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        name: filename.replace('.json', ''),
      },
    };
    const jsonString = JSON.stringify(fullProject, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    triggerDownload(blob, filename);
  } catch (err: any) {
    throw new Error('Project Save Failed: ' + (err.message || err));
  }
}

/**
 * Opens and validates Project JSON
 */
export async function loadProjectFromFile(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as ProjectData;

        // Validation (Section 26 & 40)
        if (!data || typeof data !== 'object') {
          return reject(new Error('Corrupt Project: Invalid JSON structure'));
        }
        if (!data.version) {
          return reject(new Error('Corrupt Project: Missing version attribute'));
        }
        // Check version support
        const majorVersion = data.version.split('.')[0];
        const currentMajor = CURRENT_PROJECT_VERSION.split('.')[0];
        if (majorVersion !== currentMajor) {
          return reject(
            new Error(
              `Unsupported Project Version: File version ${data.version} is not compatible with supported version ${CURRENT_PROJECT_VERSION}.`
            )
          );
        }
        if (!data.canvas || !Array.isArray(data.frames)) {
          return reject(new Error('Corrupt Project: Missing canvas or frames definition'));
        }

        resolve(data);
      } catch (err: any) {
        reject(new Error('Corrupt Project: ' + (err.message || 'JSON parse error')));
      }
    };
    reader.onerror = () => reject(new Error('Corrupt Project: File read failure'));
    reader.readAsText(file);
  });
}
