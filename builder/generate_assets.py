import os
from PIL import Image, ImageDraw, ImageFilter

def create_brand_assets():
    # Assets directory path
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/assets"))
    os.makedirs(assets_dir, exist_ok=True)

    print(f"Generating brand assets in: {assets_dir}")

    # 1. GENERATE THE SVG LOGO (vector format)
    svg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Background Gradient -->
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="penGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>
  
  <!-- Background Rounded Rect -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  
  <!-- Document Sheet with shadow -->
  <rect x="128" y="96" width="256" height="320" rx="24" fill="#ffffff" filter="url(#shadow)" />
  
  <!-- Text Lines -->
  <rect x="176" y="160" width="160" height="12" rx="6" fill="#cbd5e1" />
  <rect x="176" y="208" width="160" height="12" rx="6" fill="#cbd5e1" />
  <rect x="176" y="256" width="128" height="12" rx="6" fill="#cbd5e1" />
  <rect x="176" y="304" width="96" height="12" rx="6" fill="#cbd5e1" />
  
  <!-- Pen Icon (Font Awesome free style File-Pen) -->
  <g filter="url(#shadow)">
    <!-- Pen Body (rotated 45 deg) -->
    <path d="M 334.8 153.2 L 358.8 177.2 L 243.6 292.4 L 210 292.4 L 210 258.8 L 325.2 143.6 Z" fill="#1e293b" />
    <!-- Pen Tip / Nib -->
    <path d="M 210 292.4 L 210 258.8 L 220 248.8 L 230 258.8 L 220 268.8 L 210 292.4 Z" fill="url(#penGrad)" />
    <!-- Pen Cap / Top -->
    <path d="M 325.2 143.6 L 334.8 153.2 L 358.8 129.2 C 364.8 123.2 364.8 113.6 358.8 107.6 C 352.8 101.6 343.2 101.6 337.2 107.6 Z" fill="#64748b" />
  </g>
</svg>
"""
    with open(os.path.join(assets_dir, "app-logo.svg"), "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("Saved app-logo.svg")

    # 2. GENERATE THE PNG LOGO (raster format using Pillow)
    img = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    
    # Render background gradient
    bg_gradient = Image.new("RGBA", (512, 512))
    for y in range(512):
        for x in range(512):
            factor = (x + y) / 1024.0
            r = int(79 + factor * (6 - 79))
            g = int(70 + factor * (182 - 70))
            b = int(229 + factor * (212 - 229))
            bg_gradient.putpixel((x, y), (r, g, b, 255))
            
    # Apply rounded mask to background
    bg_mask = Image.new("L", (512, 512), 0)
    bg_draw = ImageDraw.Draw(bg_mask)
    bg_draw.rounded_rectangle([0, 0, 512, 512], radius=128, fill=255)
    img.paste(bg_gradient, (0, 0), bg_mask)

    # Render soft shadow for paper sheet
    shadow_layer = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.rounded_rectangle([128, 96 + 8, 128 + 256, 96 + 320 + 8], radius=24, fill=(0, 0, 0, 60))
    blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(16))
    img.paste(blurred_shadow, (0, 0), blurred_shadow)

    # Render white paper sheet
    paper_draw = ImageDraw.Draw(img)
    paper_draw.rounded_rectangle([128, 96, 128 + 256, 96 + 320], radius=24, fill=(255, 255, 255, 255))

    # Render lines on paper
    lines_color = (203, 213, 225, 255) # Slate-300
    paper_draw.rounded_rectangle([176, 160, 176 + 160, 160 + 12], radius=6, fill=lines_color)
    paper_draw.rounded_rectangle([176, 208, 176 + 160, 208 + 12], radius=6, fill=lines_color)
    paper_draw.rounded_rectangle([176, 256, 176 + 128, 256 + 12], radius=6, fill=lines_color)
    paper_draw.rounded_rectangle([176, 304, 176 + 96, 304 + 12], radius=6, fill=lines_color)

    # Render Pen Layer (with rotation)
    pen_src = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pen_draw = ImageDraw.Draw(pen_src)

    # Draw pen vertically first (center x=256, y from 100 to 300)
    # Pen top/cap (slate)
    pen_draw.rounded_rectangle([244, 100, 268, 150], radius=4, fill=(100, 116, 139, 255))
    # Pen body (dark navy)
    pen_draw.rectangle([244, 140, 268, 280], fill=(30, 41, 59, 255))
    # Pen tip (golden Nib)
    pen_draw.polygon([(244, 280), (268, 280), (256, 305)], fill=(245, 158, 11, 255))

    # Rotate pen by -45 degrees (clockwise 45 deg) around the center (256, 256)
    rotated_pen = pen_src.rotate(-45, resample=Image.Resampling.BICUBIC)

    # Shift rotated pen down-left slightly to align with the paper design
    # Offset by (-25, 65) pixels to place it beautifully writing on the paper
    pen_aligned = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pen_aligned.paste(rotated_pen, (-25, 65))

    # Create soft shadow for the pen
    pen_shadow = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    # Extract alpha mask of the aligned pen to draw its shadow
    pen_mask = pen_aligned.split()[3]
    pen_shadow.paste((0, 0, 0, 50), (4, 12), pen_mask)
    blurred_pen_shadow = pen_shadow.filter(ImageFilter.GaussianBlur(8))

    # Composite layers
    img.paste(blurred_pen_shadow, (0, 0), blurred_pen_shadow)
    img.paste(pen_aligned, (0, 0), pen_aligned)

    # Save final PNG
    img.save(os.path.join(assets_dir, "app-logo.png"), format="PNG")
    print("Saved app-logo.png")

    # 3. SAVE THE ICO FILE (containing multiple resolutions)
    img.save(os.path.join(assets_dir, "app-icon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (256, 256)])
    print("Saved app-icon.ico")

if __name__ == "__main__":
    create_brand_assets()
