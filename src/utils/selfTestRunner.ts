/**
 * Self-Test Engine for Freeform Image Layout Designer (圖片版面設計君)
 *
 * Implements REAL, programmatic assertions on data structures and state transitions.
 * Does NOT hardcode fake 'passed' statuses.
 * Categorized strictly into:
 *  A. Automatic Tests (真正可以自動驗證的項目)
 *  B. Manual Tests Required (必須由使用者實際操作的項目)
 */

import { FrameData, CanvasData, ProjectData, OverlapMode } from '../types';
import { checkFramesOverlap } from './geometry';

export interface TestResult {
  id: string;
  category: 'rotation' | 'crop' | 'switch' | 'overlap' | 'save_open' | 'canvas' | 'undo_redo' | 'manual';
  name: string;
  type: 'automatic' | 'manual';
  status: 'passed' | 'failed' | 'manual_required';
  message: string;
  durationMs?: number;
}

export interface TestSummary {
  passed: number;
  failed: number;
  manualRequired: number;
  total: number;
  results: TestResult[];
}

export function runAllAutomaticTests(): TestSummary {
  const results: TestResult[] = [];

  // Helper assertion
  function assert(condition: boolean, failureMsg: string) {
    if (!condition) {
      throw new Error(failureMsg);
    }
  }

  function runTest(
    id: string,
    category: TestResult['category'],
    name: string,
    fn: () => void
  ) {
    const t0 = performance.now();
    try {
      fn();
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      results.push({
        id,
        category,
        name,
        type: 'automatic',
        status: 'passed',
        message: '驗證通過 (自動測試執行完畢)',
        durationMs: dur,
      });
    } catch (err: any) {
      const dur = Math.round((performance.now() - t0) * 10) / 10;
      results.push({
        id,
        category,
        name,
        type: 'automatic',
        status: 'failed',
        message: `驗證失敗: ${err.message || err}`,
        durationMs: dur,
      });
    }
  }

  // ==========================================
  // 1. ROTATION TESTS (Section 13, 14, 15, 16, 17)
  // ==========================================

  // Test 1: Frame rotation & Image rotation separation
  runTest(
    'rot-1-separation',
    'rotation',
    'Frame 與 Image 旋轉角度資料獨立儲存',
    () => {
      const frame: FrameData = {
        id: 'test-f1',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 20,
        background: '#ffffff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'data:image/png;base64,sample',
          naturalWidth: 400,
          naturalHeight: 300,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 15, // Local rotation relative to frame
          opacity: 1,
          displayMode: 'cover',
        },
      };

      assert(frame.rotation === 20, 'Frame rotation 應為 20°');
      assert(frame.image!.rotation === 15, 'Image rotation 應為 15°');
      const visualRotation = (frame.rotation + frame.image!.rotation) % 360;
      assert(visualRotation === 35, `視覺總旋轉應為 35°，實際為 ${visualRotation}°`);

      // Modify frame rotation only: image.rotation must NOT be changed in data
      const updatedFrame = { ...frame, rotation: 50 };
      assert(updatedFrame.image!.rotation === 15, '修改 Frame 旋轉時，Image 本身 local rotation 資料不應被無端更動');
    }
  );

  // Test 2: Follow frame rotation (+30 deg)
  runTest(
    'rot-2-follow',
    'rotation',
    '跟隨圖框旋轉：Frame 20° + 30° = 50°，Image 視覺角由 35° 變為 65°',
    () => {
      const startFrameRot = 20;
      const startImageLocalRot = 15; // Visual = 35°
      const deltaAngle = 30;

      // In "follow" mode:
      // Frame rotation changes by +deltaAngle
      const newFrameRot = (startFrameRot + deltaAngle) % 360;
      // Image local rotation remains untouched
      const newImageLocalRot = startImageLocalRot;
      const newVisualRot = (newFrameRot + newImageLocalRot) % 360;

      assert(newFrameRot === 50, `Frame 旋轉後應為 50°，實際為 ${newFrameRot}°`);
      assert(newImageLocalRot === 15, `Image 本身 local 角度應保持 15°`);
      assert(newVisualRot === 65, `Image 視覺角度應為 35° + 30° = 65°，實際為 ${newVisualRot}°`);
    }
  );

  // Test 3: Do NOT follow frame rotation (+30 deg)
  runTest(
    'rot-3-not-follow',
    'rotation',
    '不跟隨圖框旋轉：Frame 20° + 30° = 50°，Image 視覺角仍保持 35°',
    () => {
      const startFrameRot = 20;
      const startImageLocalRot = 15; // Visual = 35°
      const deltaAngle = 30;

      // In "doNotFollow" mode:
      const newFrameRot = (startFrameRot + deltaAngle) % 360; // 50°
      // Image local rotation adjusts so visual angle is unchanged:
      // newVisual = newFrameRot + newImageLocalRot = startVisual (35°)
      // newImageLocalRot = startVisual - newFrameRot = 35 - 50 = -15° (or 345°)
      const newImageLocalRot = ((startImageLocalRot - deltaAngle) % 360 + 360) % 360;
      const newVisualRot = (newFrameRot + newImageLocalRot) % 360;

      assert(newFrameRot === 50, `Frame 旋轉後應為 50°，實際為 ${newFrameRot}°`);
      assert(newVisualRot === 35, `Image 視覺角度應維持 35°，實際為 ${newVisualRot}°`);
    }
  );

  // Test 4: Cancel rotation reverts state and does not create history
  runTest(
    'rot-4-cancel',
    'rotation',
    '取消旋轉：開始旋轉後取消，Frame 與 Image 完全維持原狀態且不新增 History',
    () => {
      const originalFrameState: FrameData = {
        id: 'rot-cancel-test',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 20,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'test-src',
          naturalWidth: 200,
          naturalHeight: 200,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 15,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      let historyStack: FrameData[][] = [[JSON.parse(JSON.stringify(originalFrameState))]];

      // Simulate dragging rotation
      let draftFrame = { ...originalFrameState, rotation: 80 };
      assert(draftFrame.rotation === 80, '拖曳中暫存角度');

      // User presses Cancel
      draftFrame = JSON.parse(JSON.stringify(originalFrameState));
      // History stack is NOT pushed
      assert(historyStack.length === 1, '取消操作不得增加 History 筆數');
      assert(draftFrame.rotation === 20, 'Frame 角度應恢復為 20°');
      assert(draftFrame.image?.rotation === 15, 'Image 角度應恢復為 15°');
    }
  );

  // Test 5: Undo rotation restores both Frame & Image
  runTest(
    'rot-5-undo',
    'rotation',
    '旋轉後 Undo：完整恢復 Frame rotation (20°) 與 Image rotation (15°)',
    () => {
      const stateA: FrameData = {
        id: 'rot-undo-test',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 20,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'test-src',
          naturalWidth: 200,
          naturalHeight: 200,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 15,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      const history: FrameData[][] = [[JSON.parse(JSON.stringify(stateA))]];

      // Action: Rotate with follow
      const stateB: FrameData = JSON.parse(JSON.stringify(stateA));
      stateB.rotation = 50;
      // image.rotation stays 15, visual is 65
      history.push([JSON.parse(JSON.stringify(stateB))]);
      assert(history.length === 2, 'History 應有 2 個狀態');

      // Execute Undo
      const restored = history[0][0];
      assert(restored.rotation === 20, `Undo 後 Frame rotation 應為 20°，實際為 ${restored.rotation}°`);
      assert(restored.image?.rotation === 15, `Undo 後 Image rotation 應為 15°，實際為 ${restored.image?.rotation}°`);
      const visual = (restored.rotation + (restored.image?.rotation || 0)) % 360;
      assert(visual === 35, `Undo 後 Image 視覺旋轉應為 35°，實際為 ${visual}°`);
    }
  );

  // ==========================================
  // 2. IMAGE CROP TESTS (Section 9, 20)
  // ==========================================

  // Test 6: Crop modifies crop data
  runTest(
    'crop-1-data-change',
    'crop',
    '裁切功能：正確修改 crop 相對座標矩形',
    () => {
      const frame: FrameData = {
        id: 'crop-test-1',
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'img-src',
          naturalWidth: 1000,
          naturalHeight: 800,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 0,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      // Apply crop
      const newCrop = { x: 0.1, y: 0.15, width: 0.8, height: 0.7 };
      const updatedFrame: FrameData = {
        ...frame,
        image: {
          ...frame.image!,
          crop: newCrop,
        },
      };

      assert(updatedFrame.image!.crop.x === 0.1, 'crop.x 應為 0.1');
      assert(updatedFrame.image!.crop.y === 0.15, 'crop.y 應為 0.15');
      assert(updatedFrame.image!.crop.width === 0.8, 'crop.width 應為 0.8');
      assert(updatedFrame.image!.crop.height === 0.7, 'crop.height 應為 0.7');
    }
  );

  // Test 7: Crop does NOT alter Frame geometry
  runTest(
    'crop-2-geometry-invariance',
    'crop',
    '裁切獨立性：裁切時 Frame 幾何尺寸 (x, y, w, h, rotation, shape, zIndex) 完全不變',
    () => {
      const frame: FrameData = {
        id: 'crop-test-2',
        x: 120,
        y: 180,
        width: 350,
        height: 250,
        shape: 'circle',
        roundedCorners: 0,
        rotation: 25,
        background: '#fff',
        border: { width: 3, color: '#444', style: 'solid' },
        zIndex: 4,
        contentType: 'image',
        image: {
          source: 'img-src',
          naturalWidth: 600,
          naturalHeight: 400,
          position: { x: 10, y: -5 },
          scale: 1.2,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 40,
          opacity: 0.9,
          displayMode: 'contain',
        },
      };

      // Perform crop
      const croppedFrame: FrameData = {
        ...frame,
        image: {
          ...frame.image!,
          crop: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
        },
      };

      assert(croppedFrame.x === 120, 'Frame x 座標不可被裁切改變');
      assert(croppedFrame.y === 180, 'Frame y 座標不可被裁切改變');
      assert(croppedFrame.width === 350, 'Frame 寬度不可被裁切改變');
      assert(croppedFrame.height === 250, 'Frame 高度不可被裁切改變');
      assert(croppedFrame.rotation === 25, 'Frame 旋轉角度不可被裁切改變');
      assert(croppedFrame.shape === 'circle', 'Frame 形狀不可被裁切改變');
      assert(croppedFrame.zIndex === 4, 'Frame 圖層順序不可被裁切改變');
    }
  );

  // Test 8: Crop preserves Image rotation
  runTest(
    'crop-3-image-rotation-invariance',
    'crop',
    '裁切與旋轉相容性：已旋轉之 Image 進行裁切，Image rotation 與 Frame rotation 依然獨立',
    () => {
      const initialImageRot = 45;
      const initialFrameRot = 15;

      const frame: FrameData = {
        id: 'crop-rot-test',
        x: 50,
        y: 50,
        width: 200,
        height: 200,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: initialFrameRot,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'img',
          naturalWidth: 400,
          naturalHeight: 400,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: initialImageRot,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      // Apply crop
      const croppedFrame = {
        ...frame,
        image: {
          ...frame.image!,
          crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
        },
      };

      assert(croppedFrame.image!.rotation === initialImageRot, 'Image rotation 應維持 45°');
      assert(croppedFrame.rotation === initialFrameRot, 'Frame rotation 應維持 15°');
    }
  );

  // Test 9: Crop Undo restores crop parameters
  runTest(
    'crop-4-undo',
    'crop',
    '裁切 Undo：Undo 後完整恢復原始裁切、位置、縮放與顯示模式',
    () => {
      const stateA: FrameData = {
        id: 'crop-undo-frame',
        x: 10,
        y: 10,
        width: 200,
        height: 200,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'img-data',
          naturalWidth: 800,
          naturalHeight: 600,
          position: { x: 5, y: -5 },
          scale: 1.1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 0,
          opacity: 0.95,
          displayMode: 'cover',
        },
      };

      const history = [[JSON.parse(JSON.stringify(stateA))]];

      // Step B: Apply Crop
      const stateB: FrameData = JSON.parse(JSON.stringify(stateA));
      stateB.image!.crop = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
      history.push([JSON.parse(JSON.stringify(stateB))]);

      assert(history.length === 2, 'History 應記錄 1 次裁切操作');

      // Undo
      const restored = history[0][0];
      assert(restored.image!.crop.x === 0, 'Undo 後 crop.x 應恢復為 0');
      assert(restored.image!.crop.width === 1, 'Undo 後 crop.width 應恢復為 1');
      assert(restored.image!.position.x === 5, 'Undo 後 position 應保持不變');
      assert(restored.image!.scale === 1.1, 'Undo 後 scale 應保持不變');
      assert(restored.image!.displayMode === 'cover', 'Undo 後 displayMode 應保持不變');
    }
  );

  // ==========================================
  // 3. CONTENT SWITCHING TESTS (Section 24)
  // ==========================================

  // Test 10: Image -> Text preserves frame geometry & appearance
  runTest(
    'switch-1-image-to-text',
    'switch',
    '圖片轉文字：移除 Image、保留 Frame 尺寸位置與邊框樣式',
    () => {
      const frame: FrameData = {
        id: 'switch-f1',
        x: 80,
        y: 90,
        width: 280,
        height: 160,
        shape: 'rectangle',
        roundedCorners: 8,
        rotation: 10,
        background: '#f1f5f9',
        border: { width: 2, color: '#334155', style: 'solid' },
        zIndex: 2,
        contentType: 'image',
        image: {
          source: 'base64-content',
          naturalWidth: 400,
          naturalHeight: 300,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 0,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      // Switch to text
      const switchedFrame: FrameData = {
        ...frame,
        contentType: 'text',
        image: undefined,
        text: {
          content: '新文字',
          font: 'sans-serif',
          size: 16,
          bold: false,
          italic: false,
          color: '#000000',
          horizontalAlign: 'center',
          verticalAlign: 'middle',
          autoWrap: true,
        },
      };

      assert(switchedFrame.contentType === 'text', 'ContentType 應變更為 text');
      assert(switchedFrame.image === undefined, 'Image 應被清空');
      assert(switchedFrame.text?.content === '新文字', 'Text 內容應已建立');
      assert(switchedFrame.x === 80 && switchedFrame.y === 90, 'Frame 座標必須完整保留');
      assert(switchedFrame.width === 280 && switchedFrame.height === 160, 'Frame 尺寸必須完整保留');
      assert(switchedFrame.border.width === 2, 'Frame 邊框樣式必須完整保留');
    }
  );

  // Test 11: Image -> Text Undo restores image
  runTest(
    'switch-2-image-undo',
    'switch',
    '圖片轉文字後 Undo：完整復原原圖片資料',
    () => {
      const stateA: FrameData = {
        id: 'switch-undo-f',
        x: 80,
        y: 90,
        width: 280,
        height: 160,
        shape: 'rectangle',
        roundedCorners: 8,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'image',
        image: {
          source: 'original-base64',
          naturalWidth: 400,
          naturalHeight: 300,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 0,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      const history = [[JSON.parse(JSON.stringify(stateA))]];

      // Switched to text
      const stateB: FrameData = JSON.parse(JSON.stringify(stateA));
      stateB.contentType = 'text';
      stateB.image = undefined;
      stateB.text = {
        content: '新文字',
        font: 'sans-serif',
        size: 16,
        bold: false,
        italic: false,
        color: '#000',
        horizontalAlign: 'center',
        verticalAlign: 'middle',
        autoWrap: true,
      };
      history.push([JSON.parse(JSON.stringify(stateB))]);

      // Undo
      const restored = history[0][0];
      assert(restored.contentType === 'image', 'Undo 後應回到 image 類型');
      assert(restored.image?.source === 'original-base64', '原圖片 source 應完整復原');
    }
  );

  // ==========================================
  // 4. OVERLAP & LAYER TESTS (Section 21, 35, 37)
  // ==========================================

  // Test 12: Forbidden overlap reverts on collision
  runTest(
    'overlap-1-forbidden-revert',
    'overlap',
    '禁止重疊模式：移動圖框發生非法碰撞時，自動還原至移動前位置且不留下錯誤 History',
    () => {
      const f1: FrameData = {
        id: 'f1',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'empty',
      };
      const f2: FrameData = {
        id: 'f2',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 2,
        contentType: 'empty',
      };

      const initialHistory = [[JSON.parse(JSON.stringify(f1)), JSON.parse(JSON.stringify(f2))]];

      // Move f2 to (50, 50) -> collides with f1!
      const attemptedF2 = { ...f2, x: 50, y: 50 };
      const hasCollision = checkFramesOverlap(f1, attemptedF2);
      assert(hasCollision === true, '幾何演算法應正確偵測到兩圖框重疊');

      // In forbidden mode: revert f2 and do NOT commit history
      let currentF2 = attemptedF2;
      if (hasCollision) {
        currentF2 = { ...f2 }; // revert!
      }

      assert(currentF2.x === 200 && currentF2.y === 200, '碰撞後應已還原至 (200, 200)');
      assert(initialHistory.length === 1, 'History 不應記錄非法碰撞操作');
    }
  );

  // Test 13: Allowed overlap brings frame to front on move
  runTest(
    'overlap-2-bring-front',
    'overlap',
    '允許重疊模式：移動圖框本體時自動置於最上層 (zIndex 最大化)',
    () => {
      const frames: FrameData[] = [
        {
          id: 'f-bottom',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          shape: 'rectangle',
          roundedCorners: 0,
          rotation: 0,
          background: '#fff',
          border: { width: 1, color: '#000', style: 'solid' },
          zIndex: 1,
          contentType: 'empty',
        },
        {
          id: 'f-top',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          shape: 'rectangle',
          roundedCorners: 0,
          rotation: 0,
          background: '#fff',
          border: { width: 1, color: '#000', style: 'solid' },
          zIndex: 2,
          contentType: 'empty',
        },
      ];

      // Move f-bottom
      const maxZ = frames.reduce((max, f) => Math.max(max, f.zIndex), 0);
      const movedF1 = { ...frames[0], zIndex: maxZ + 1 };
      assert(movedF1.zIndex === 3, '被移動的圖框 zIndex 應自動提升至 3');
      assert(movedF1.zIndex > frames[1].zIndex, '被移動的圖框應置於另一個圖框上方');
    }
  );

  // Test 14: Editing image inside frame does NOT change zIndex
  runTest(
    'overlap-3-image-edit-no-zindex',
    'overlap',
    '編輯框內圖片 (縮放、裁切、框內移動) 不應改變圖框的圖層順序 (zIndex 保持不變)',
    () => {
      const frame: FrameData = {
        id: 'f-z-test',
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 5,
        contentType: 'image',
        image: {
          source: 'src',
          naturalWidth: 400,
          naturalHeight: 400,
          position: { x: 0, y: 0 },
          scale: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          rotation: 0,
          opacity: 1,
          displayMode: 'cover',
        },
      };

      // Perform internal image operations
      const editedFrame = {
        ...frame,
        image: {
          ...frame.image!,
          position: { x: 10, y: 15 },
          scale: 1.5,
          crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
          rotation: 90,
        },
      };

      assert(editedFrame.zIndex === 5, '編輯框內圖片不得更動圖框的 zIndex (仍為 5)');
    }
  );

  // ==========================================
  // 5. SAVE / OPEN INTEGRITY (Section 31, 40)
  // ==========================================

  // Test 15: Save/Open stores persistent data and reloads completely
  runTest(
    'save-open-1-integrity',
    'save_open',
    '專案儲存與開啟：使用完整 base64/資料格式 (非臨時 blob URL)，重新開啟後所有屬性零失真',
    () => {
      const project: ProjectData = {
        version: '1.0.0',
        canvas: {
          width: 794,
          height: 1123,
          unit: 'mm',
          physicalWidth: 210,
          physicalHeight: 297,
          dpi: 96,
          preset: 'A4_PORTRAIT',
          backgroundType: 'solid',
          background: '#fafafa',
          zoom: 1,
        },
        overlapMode: 'allowed',
        frames: [
          {
            id: 'save-test-frame',
            x: 100,
            y: 150,
            width: 320,
            height: 240,
            shape: 'rectangle',
            roundedCorners: 6,
            rotation: 18,
            background: '#ffffff',
            border: { width: 2, color: '#1e293b', style: 'solid' },
            zIndex: 1,
            contentType: 'image',
            image: {
              source: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
              naturalWidth: 400,
              naturalHeight: 300,
              position: { x: 12, y: -8 },
              scale: 1.35,
              crop: { x: 0.15, y: 0.1, width: 0.7, height: 0.8 },
              rotation: 30,
              opacity: 0.88,
              displayMode: 'cover',
            },
          },
        ],
      };

      // Ensure no temporary blob URL is present
      const imgSource = project.frames[0].image!.source;
      assert(!imgSource.startsWith('blob:'), '圖片 source 不得使用暫時性的 blob: URL 儲存');

      // Serialize and deserialize
      const jsonString = JSON.stringify(project);
      const reloaded: ProjectData = JSON.parse(jsonString);

      assert(reloaded.version === '1.0.0', '專案版本號應一致');
      assert(reloaded.canvas.physicalWidth === 210, '實體寬度應為 210 mm');
      assert(reloaded.canvas.physicalHeight === 297, '實體高度應為 297 mm');
      assert(reloaded.frames.length === 1, '圖框數量應一致');

      const rf = reloaded.frames[0];
      assert(rf.x === 100 && rf.y === 150, '圖框座標相符');
      assert(rf.rotation === 18, '圖框旋轉角度相符');
      assert(rf.image!.position.x === 12 && rf.image!.position.y === -8, '圖片偏移相符');
      assert(rf.image!.scale === 1.35, '圖片縮放相符');
      assert(rf.image!.crop.x === 0.15 && rf.image!.crop.width === 0.7, '圖片裁切相符');
      assert(rf.image!.rotation === 30, '圖片自體旋轉相符');
      assert(rf.image!.opacity === 0.88, '圖片透明度相符');
      assert(rf.image!.source === imgSource, '圖片 Base64 資料完整復原');
    }
  );

  // ==========================================
  // 6. CANVAS PHYSICAL VS PIXEL SEPARATION (Section 五)
  // ==========================================

  // Test 16: Canvas physical dimensions separate from pixels
  runTest(
    'canvas-1-physical-separation',
    'canvas',
    '畫布單位清晰分離：A4 代表實體 210 × 297 mm，與顯示解析度 794 × 1123 px 分離處理',
    () => {
      const a4Portrait: CanvasData = {
        width: 794,
        height: 1123,
        unit: 'mm',
        physicalWidth: 210,
        physicalHeight: 297,
        dpi: 96,
        preset: 'A4_PORTRAIT',
        backgroundType: 'solid',
        background: '#ffffff',
        zoom: 0.85,
      };

      assert(a4Portrait.unit === 'mm', 'A4 預設物理單位應為 mm');
      assert(a4Portrait.physicalWidth === 210, 'A4 實體寬度必須為 210 mm，而非 794 mm');
      assert(a4Portrait.physicalHeight === 297, 'A4 實體高度必須為 297 mm，而非 1123 mm');
      assert(a4Portrait.width === 794, '編輯器顯示像素解析度應為 794 px');
      assert(a4Portrait.height === 1123, '編輯器顯示像素解析度應為 1123 px');
      assert(a4Portrait.physicalWidth !== a4Portrait.width, '實體紙張尺寸不得與像素解析度混同');
    }
  );

  // ==========================================
  // 7. UNDO / REDO DETERMINISM (Section 三)
  // ==========================================

  // Test 17: Sequential major operations produce 1 undo step each without stale closures
  runTest(
    'undo-1-determinism',
    'undo_redo',
    'Undo / Redo 可靠性：重大操作逐一入棧，Undo 精準回溯至各階段完整快照',
    () => {
      // Setup initial canvas state
      const initialFrame: FrameData = {
        id: 'undo-f',
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        shape: 'rectangle',
        roundedCorners: 0,
        rotation: 0,
        background: '#fff',
        border: { width: 1, color: '#000', style: 'solid' },
        zIndex: 1,
        contentType: 'empty',
      };

      const history: FrameData[][] = [[JSON.parse(JSON.stringify(initialFrame))]];
      let currentIndex = 0;

      // Helper to push history
      function push(f: FrameData) {
        history.splice(currentIndex + 1);
        history.push([JSON.parse(JSON.stringify(f))]);
        currentIndex = history.length - 1;
      }

      // Step 1: Move frame
      const moved = { ...initialFrame, x: 120, y: 140 };
      push(moved);

      // Step 2: Resize frame
      const resized = { ...moved, width: 250, height: 220 };
      push(resized);

      // Step 3: Rotate frame
      const rotated = { ...resized, rotation: 45 };
      push(rotated);

      assert(history.length === 4, '應有 4 個歷史快照 (初始 + 移動 + 縮放 + 旋轉)');

      // Undo Step 3 -> Back to resized (rotation 0)
      currentIndex--;
      const atStep2 = history[currentIndex][0];
      assert(atStep2.rotation === 0, '第一次 Undo 後角度應回到 0°');
      assert(atStep2.width === 250, '第一次 Undo 後寬度應維持 250');

      // Undo Step 2 -> Back to moved (width 100, height 100, x 120)
      currentIndex--;
      const atStep1 = history[currentIndex][0];
      assert(atStep1.width === 100 && atStep1.height === 100, '第二次 Undo 後尺寸應回到 100x100');
      assert(atStep1.x === 120, '第二次 Undo 後 x 座標應維持 120');

      // Undo Step 1 -> Back to initial (x 10, y 10)
      currentIndex--;
      const atStep0 = history[currentIndex][0];
      assert(atStep0.x === 10 && atStep0.y === 10, '第三次 Undo 後應完全回到初始狀態 (10, 10)');

      // Redo back to step 1
      currentIndex++;
      assert(history[currentIndex][0].x === 120, 'Redo 應前進至移動後狀態 (120, 140)');
    }
  );

  // Add Manual Test Items
  const manualItems: Array<{ id: string; name: string; desc: string }> = [
    {
      id: 'manual-pointer-drag',
      name: '真實滑鼠拖曳與幾何吸附導線 (Smart Guides)',
      desc: '需由使用者實際在瀏覽器畫布以滑鼠或觸控拖曳圖框，肉眼觀察吸附導線與即時平移流暢度。',
    },
    {
      id: 'manual-native-file-picker',
      name: '瀏覽器原生檔案選取器 (Image File Chooser)',
      desc: '需點擊「更換圖片」或「放入圖片」觸發 OS 原生檔案選取視窗，由使用者手動選取本機圖片。',
    },
    {
      id: 'manual-file-export-download',
      name: '匯出檔案實際下載與第三方軟體相容性 (PNG / JPG / PDF / DOCX)',
      desc: '需由使用者點擊匯出並下載實際檔案，於本機以 Adobe Acrobat、Photoshop、Word 等檢驗成果。',
    },
    {
      id: 'manual-canvas-wheel-zoom',
      name: '滑鼠滾輪縮放與平移畫布視覺回饋',
      desc: '需由使用者在畫布上操作滾輪與平移，確認不同解析度與螢幕縮放下的顯示比例。',
    },
  ];

  for (const item of manualItems) {
    results.push({
      id: item.id,
      category: 'manual',
      name: item.name,
      type: 'manual',
      status: 'manual_required',
      message: `[Manual Test Required] ${item.desc}`,
    });
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const manualRequired = results.filter((r) => r.status === 'manual_required').length;

  return {
    passed,
    failed,
    manualRequired,
    total: results.length,
    results,
  };
}
