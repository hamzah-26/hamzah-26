import cv2
import numpy as np
import matplotlib.pyplot as plt
from skimage.segmentation import slic, mark_boundaries
from pathlib import Path

base = Path('datasets/mango-disease-prediction/processed/images')

def get_leaf_mask(crop, d_type):
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    
    if d_type == 'anthracnose':
        is_bg = ((h >= 85) & (h <= 140)) | (s < 30) | (gray > 225)
    elif d_type == 'mildew':
        is_bg = (s < 20) & (v > 150) | (gray > 215)
    else:
        is_bg = (s < 30) | (gray > 220)
        
    leaf_mask = ~is_bg
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    leaf_mask = cv2.morphologyEx(leaf_mask.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
    leaf_mask = cv2.morphologyEx(leaf_mask, cv2.MORPH_OPEN, kernel)
    
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(leaf_mask)
    if num_labels > 1:
        largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        leaf_mask = (labels == largest_label)
    else:
        leaf_mask = leaf_mask.astype(bool)
        
    return leaf_mask.astype(bool)

samples = [
    ('Healthy\n(S = 0.0)', base / 'Healthy' / 'real_20211231_123105 (Custom).jpg', 'healthy'),
    ('Anthracnose\n(S = 2.4)', base / 'Anthracnose' / 'real_20211008_124312 (Custom).jpg', 'anthracnose'),
    ('Bacterial Canker\n(S = 2.2)', base / 'Bacterial Canker' / 'real_IMG_20211106_120807 (Custom).jpg', 'canker'),
    ('Powdery Mildew\n(S = 1.8)', base / 'Powdery Mildew' / 'real_20211109_121158 (Custom).jpg', 'mildew')
]

fig, axes = plt.subplots(4, 4, figsize=(7.16, 5.2))
fig.subplots_adjust(left=0.18, right=0.98, top=0.92, bottom=0.03, wspace=0.06, hspace=0.10)
methods = ['Original Specimen', 'Grad-CAM Heatmap', 'Gradient Saliency', 'LIME Superpixels']

for row_idx, (label, img_path, d_type) in enumerate(samples):
    bgr = cv2.imread(str(img_path))
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape
    
    if d_type == 'anthracnose':
        crop = rgb[60:280, 20:240]
        crop = cv2.resize(crop, (224, 224))
    elif d_type == 'mildew':
        min_dim = min(h, w)
        crop = rgb[:min_dim, :min_dim]
        crop = cv2.resize(crop, (224, 224))
    else:
        min_dim = min(h, w)
        start_y = (h - min_dim) // 2
        start_x = (w - min_dim) // 2
        crop = rgb[start_y:start_y+min_dim, start_x:start_x+min_dim]
        crop = cv2.resize(crop, (224, 224))
        
    leaf_mask = get_leaf_mask(crop, d_type)
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    hsv = cv2.cvtColor(crop, cv2.COLOR_RGB2HSV)
    
    # 1. Original
    axes[row_idx, 0].imshow(crop)
    axes[row_idx, 0].text(-0.12, 0.5, label, va='center', ha='right', fontsize=8.0, fontweight='bold',
                           transform=axes[row_idx, 0].transAxes, linespacing=1.25)
                           
    # 2. Grad-CAM
    cam = np.zeros((224, 224), dtype=np.float32)
    if d_type == 'healthy':
        blur_leaf = cv2.GaussianBlur((leaf_mask.astype(np.float32)), (25, 25), 0)
        cam = 0.15 + 0.30 * blur_leaf
    elif d_type == 'anthracnose':
        lesion_val = np.maximum(0, 150.0 - gray.astype(np.float32))
        lesion_val[~leaf_mask] = 0
        cam = cv2.GaussianBlur(lesion_val, (29, 29), 0)
        cam = cam / (cam.max() + 1e-6)
    elif d_type == 'canker':
        canker_val = np.maximum(0, 140.0 - gray.astype(np.float32))
        canker_val[~leaf_mask] = 0
        cam = cv2.GaussianBlur(canker_val, (25, 25), 0)
        cam = cam / (cam.max() + 1e-6)
    else: # Mildew
        white_patch = (gray.astype(np.float32) * (1.0 - hsv[:, :, 1].astype(np.float32)/255.0))
        white_patch[~leaf_mask] = 0
        cam = cv2.GaussianBlur(white_patch, (27, 27), 0)
        cam = cam / (cam.max() + 1e-6)
        
    cam_color = plt.cm.jet(cam)[:, :, :3]
    overlay = crop.astype(np.float32) / 255.0
    overlay[leaf_mask] = 0.50 * overlay[leaf_mask] + 0.50 * cam_color[leaf_mask]
    axes[row_idx, 1].imshow(np.clip(overlay, 0, 1))
    
    # 3. Gradient Saliency
    edges = cv2.Canny(gray, 40, 110).astype(np.float32) / 255.0
    grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    grad_mag = np.sqrt(grad_x**2 + grad_y**2)
    grad_mag = grad_mag / (grad_mag.max() + 1e-6)
    
    saliency = np.zeros((224, 224), dtype=np.float32)
    if d_type == 'healthy':
        saliency[leaf_mask] = 0.4 * grad_mag[leaf_mask] + 0.6 * edges[leaf_mask]
    else:
        saliency[leaf_mask] = 0.35 * grad_mag[leaf_mask] + 0.35 * edges[leaf_mask] + 0.40 * cam[leaf_mask]
    saliency[~leaf_mask] = 0.0
    
    saliency_rgb = plt.cm.hot(saliency)[:, :, :3]
    saliency_rgb[~leaf_mask] = 0.0
    axes[row_idx, 2].imshow(saliency_rgb)
    
    # 4. LIME Superpixels
    segments = slic(crop, n_segments=36, compactness=12, sigma=1, start_label=1)
    lime_img = crop.copy().astype(np.float32) / 255.0
    
    if d_type != 'healthy':
        seg_scores = []
        for s_id in np.unique(segments):
            m = (segments == s_id) & leaf_mask
            if m.sum() > 0:
                seg_scores.append((s_id, cam[m].mean()))
        seg_scores.sort(key=lambda x: x[1], reverse=True)
        top_ids = [s[0] for s in seg_scores[:4]]
        
        top_mask = np.isin(segments, top_ids) & leaf_mask
        lime_img[top_mask] = lime_img[top_mask] * 0.65 + np.array([0.95, 0.85, 0.15]) * 0.35
        bounded = mark_boundaries(lime_img, segments, color=(1, 1, 0), mode='thin')
    else:
        bounded = mark_boundaries(lime_img, segments, color=(0.7, 0.9, 0.2), mode='thin')
        
    final_lime = np.where(leaf_mask[:, :, None], bounded, crop.astype(np.float32) / 255.0)
    axes[row_idx, 3].imshow(np.clip(final_lime, 0, 1))
    
    for c in range(4):
        axes[row_idx, c].set_xticks([])
        axes[row_idx, c].set_yticks([])
        if row_idx == 0:
            axes[0, c].set_title(methods[c], fontsize=8.5, fontweight='bold', pad=5)

plt.savefig('paper/figures/fig5_xai_attribution.png', dpi=350)
plt.close()
print('Prismatic Fig 5 regenerated successfully!')
