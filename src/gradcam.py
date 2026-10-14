"""
gradcam.py — Reusable Grad-CAM heatmap utility
================================================
Used by both evaluation.ipynb and app.py.

Grad-CAM (Gradient-weighted Class Activation Mapping) highlights the regions
of an input image that most influenced a model's prediction.  It works by:
  1. Recording the activations of the last convolutional layer
  2. Computing the gradient of the predicted class score w.r.t. those activations
  3. Weighting each feature map channel by its average gradient
  4. Taking a ReLU of the weighted sum (keeps only positive influence)

Reference: Selvaraju et al., 2017 — https://arxiv.org/abs/1610.02391

Last-conv layer names for the three models used in this project:
  MobileNetV2    → 'out_relu'
  EfficientNetB0 → 'top_activation'
  MobileNetV3Large → find with: [l.name for l in model.layers if 'conv' in l.name][-1]
"""

import numpy as np
import cv2
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import Model
import matplotlib.pyplot as plt
import matplotlib.cm as cm

# Map model name strings to their last conv layer name
LAST_CONV_LAYER = {
    "mobilenetv2":    "out_relu",
    "efficientnetb0": "top_activation",
    # MobileNetV3Large: update this after running model.summary()
    "mobilenetv3":    "multiply_19",
}


def get_gradcam_heatmap(
    model: keras.Model,
    img_array: np.ndarray,
    class_idx: int,
    last_conv_layer_name: str,
) -> np.ndarray:
    """
    Compute a Grad-CAM heatmap for a single image.

    Args:
        model               : Trained Keras model (full model, not just the base).
        img_array           : Preprocessed image with batch dimension, shape (1, H, W, 3).
                              Use the same preprocessing as during training.
        class_idx           : Index of the class to explain.
        last_conv_layer_name: Name of the last convolutional layer in the model.

    Returns:
        heatmap: float32 numpy array of shape (H_feat, W_feat), values in [0, 1].
                 This is at the feature map resolution — call overlay_heatmap()
                 to resize and blend it onto the original image.

    Raises:
        ValueError: if last_conv_layer_name is not found in the model.
    """
    # Validate layer name early with a clear error message
    layer_names = [l.name for l in model.layers]
    if last_conv_layer_name not in layer_names:
        raise ValueError(
            f"Layer '{last_conv_layer_name}' not found in model.\n"
            f"Available layers (last 10): {layer_names[-10:]}\n"
            f"Tip: run [l.name for l in model.layers if 'conv' in l.name.lower()] "
            f"to find the right name."
        )

    # Build a sub-model that outputs (conv_features, final_predictions)
    grad_model = Model(
        inputs=model.inputs,
        outputs=[
            model.get_layer(last_conv_layer_name).output,  # feature maps
            model.output,                                   # class probabilities
        ],
    )

    # Forward pass inside a GradientTape so we can differentiate
    with tf.GradientTape() as tape:
        # Cast to float32 — tape needs a float tensor to watch
        img_tensor = tf.cast(img_array, tf.float32)
        conv_outputs, predictions = grad_model(img_tensor, training=False)
        # Score for the target class (scalar per batch item)
        class_score = predictions[:, class_idx]

    # Gradient of the class score w.r.t. every pixel of the conv feature maps
    grads = tape.gradient(class_score, conv_outputs)  # shape: (1, h, w, C)

    # Average gradient across the spatial dimensions → importance weight per channel
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))  # shape: (C,)

    # Weighted combination of feature maps
    conv_outputs = conv_outputs[0]                          # (h, w, C)
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]  # (h, w, 1)
    heatmap = tf.squeeze(heatmap)                           # (h, w)

    # ReLU: keep only features that have a positive influence on the class
    heatmap = tf.maximum(heatmap, 0)

    # Normalise to [0, 1]
    heatmap = heatmap / (tf.math.reduce_max(heatmap) + 1e-8)

    return heatmap.numpy().astype("float32")


def overlay_heatmap(
    original_img: np.ndarray,
    heatmap: np.ndarray,
    alpha: float = 0.4,
    colormap: int = cv2.COLORMAP_JET,
) -> np.ndarray:
    """
    Resize the heatmap to match the original image and blend them.

    Args:
        original_img: uint8 RGB image, shape (H, W, 3).
        heatmap     : float32 array in [0, 1], shape (h, w).
        alpha       : opacity of the heatmap overlay (0 = invisible, 1 = full).
        colormap    : OpenCV colormap constant (default: COLORMAP_JET).

    Returns:
        overlaid: uint8 RGB image of the same size as original_img.
    """
    H, W = original_img.shape[:2]

    # Resize heatmap to full image resolution
    heatmap_resized = cv2.resize(heatmap, (W, H))

    # Apply colour map — cv2.applyColorMap expects uint8 [0, 255]
    heatmap_uint8 = np.uint8(255 * heatmap_resized)
    heatmap_color = cv2.applyColorMap(heatmap_uint8, colormap)

    # cv2.applyColorMap returns BGR — convert to RGB to match our pipeline
    heatmap_rgb = cv2.cvtColor(heatmap_color, cv2.COLOR_BGR2RGB)

    # Blend: (1 - alpha) * original + alpha * heatmap
    overlaid = cv2.addWeighted(original_img, 1 - alpha, heatmap_rgb, alpha, 0)
    return overlaid


def make_gradcam_figure(
    original_img: np.ndarray,
    heatmap: np.ndarray,
    pred_label: str,
    true_label: str,
    confidence: float,
    alpha: float = 0.4,
) -> plt.Figure:
    """
    Create a three-panel figure: original | heatmap only | overlay.
    Useful for reports and the evaluation notebook.

    Args:
        original_img : uint8 RGB image.
        heatmap      : float32 [0,1] array from get_gradcam_heatmap().
        pred_label   : predicted class name.
        true_label   : ground-truth class name (pass '' if unknown).
        confidence   : model confidence for pred_label (0–1).
        alpha        : heatmap opacity for the overlay panel.

    Returns:
        matplotlib Figure (caller is responsible for plt.show() / saving).
    """
    overlay = overlay_heatmap(original_img, heatmap, alpha=alpha)

    H, W = original_img.shape[:2]
    heatmap_resized = cv2.resize(heatmap, (W, H))

    fig, axes = plt.subplots(1, 3, figsize=(13, 4))

    axes[0].imshow(original_img)
    axes[0].set_title("Original", fontsize=11)

    axes[1].imshow(heatmap_resized, cmap="jet", vmin=0, vmax=1)
    axes[1].set_title("Grad-CAM heatmap", fontsize=11)

    axes[2].imshow(overlay)
    correct = pred_label == true_label if true_label else None
    color   = "green" if correct else ("red" if correct is False else "black")
    title   = f"Pred: {pred_label} ({confidence*100:.0f}%)"
    if true_label:
        title += f"\nTrue: {true_label}"
    axes[2].set_title(title, fontsize=11, color=color)

    for ax in axes:
        ax.axis("off")

    plt.tight_layout()
    return fig


def gradcam_for_model(
    model: keras.Model,
    img_array: np.ndarray,
    class_idx: int,
    model_name: str,
) -> np.ndarray:
    """
    Convenience wrapper — looks up the correct last-conv layer name
    from the LAST_CONV_LAYER table and calls get_gradcam_heatmap().

    Args:
        model      : Trained Keras model.
        img_array  : Preprocessed image (1, H, W, 3).
        class_idx  : Class index to explain.
        model_name : 'mobilenetv2' | 'efficientnetb0' | 'mobilenetv3'.

    Returns:
        heatmap: float32 array in [0, 1].
    """
    layer_name = LAST_CONV_LAYER.get(model_name)
    if layer_name is None:
        raise ValueError(
            f"model_name '{model_name}' not in LAST_CONV_LAYER table. "
            f"Known keys: {list(LAST_CONV_LAYER.keys())}"
        )
    return get_gradcam_heatmap(model, img_array, class_idx, layer_name)


def preprocess_for_gradcam(
    img_bgr: np.ndarray,
    img_size: int = 224,
    model_name: str = "mobilenetv2",
) -> tuple:
    """
    Resize and preprocess a raw BGR image (as loaded by OpenCV) ready for
    Grad-CAM.  Returns both the preprocessed tensor AND the display-ready
    uint8 RGB image so the caller doesn't have to undo the preprocessing.

    Args:
        img_bgr    : uint8 BGR image from cv2.imread or st.camera_input.
        img_size   : target size (default 224).
        model_name : selects the correct preprocessing function.

    Returns:
        (img_tensor, img_rgb_uint8)
        img_tensor    : float32 numpy array shape (1, img_size, img_size, 3)
        img_rgb_uint8 : uint8 RGB array shape (img_size, img_size, 3) for display
    """
    from tensorflow.keras.applications.mobilenet_v2 import (
        preprocess_input as mnv2_pre,
    )

    # Resize
    img_resized = cv2.resize(img_bgr, (img_size, img_size))

    # BGR → RGB (OpenCV loads as BGR; our models expect RGB)
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)

    # Keep a uint8 copy for display before we normalise
    img_rgb_uint8 = img_rgb.copy()

    # Apply model-specific preprocessing
    img_float = img_rgb.astype("float32")
    if model_name == "mobilenetv2":
        img_float = mnv2_pre(img_float)          # scales to [-1, 1]
    # EfficientNetB0 and MobileNetV3 normalise inside the model — pass as-is

    img_tensor = np.expand_dims(img_float, axis=0)  # add batch dimension
    return img_tensor, img_rgb_uint8
