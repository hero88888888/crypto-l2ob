#!/usr/bin/env python3
"""
Generate PWA icons and splash screens for L2 Orderbook Analyzer
Creates all required sizes for iOS and Android
"""

import os
from PIL import Image, ImageDraw, ImageFont

def create_app_icon(size):
    """Create an app icon with the specified size"""
    # Create a new image with dark background
    img = Image.new('RGB', (size, size), color='#1a1b26')
    draw = ImageDraw.Draw(img)
    
    # Draw a stylized orderbook visualization
    center = size // 2
    bar_width = size // 10
    bar_spacing = size // 20
    
    # Draw bid bars (green)
    for i in range(3):
        y = center + (i * (bar_width + bar_spacing))
        width = size - (i * size // 8)
        draw.rectangle(
            [0, y, width, y + bar_width],
            fill='#10b981'
        )
    
    # Draw ask bars (red)
    for i in range(3):
        y = center - ((i + 1) * (bar_width + bar_spacing))
        width = size - (i * size // 8)
        draw.rectangle(
            [0, y, width, y + bar_width],
            fill='#ef4444'
        )
    
    # Draw center line (spread)
    draw.rectangle(
        [0, center - 2, size, center + 2],
        fill='#facc15'
    )
    
    # Add L2 text (only for larger icons)
    if size >= 64:
        try:
            font_size = max(12, size // 6)  # Minimum font size of 12
            font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', font_size)
        except:
            font = ImageFont.load_default()
        
        text = "L2"
        try:
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
        except:
            text_width = font_size * len(text)
            text_height = font_size
        
        text_x = size - text_width - (size // 20)
        text_y = size // 20
        
        # Draw text with shadow
        draw.text((text_x + 2, text_y + 2), text, fill='#000000', font=font)
        draw.text((text_x, text_y), text, fill='#ffffff', font=font)
    
    return img

def create_splash_screen(width, height):
    """Create a splash screen for iOS"""
    img = Image.new('RGB', (width, height), color='#0d0e14')
    draw = ImageDraw.Draw(img)
    
    # Draw centered logo
    logo_size = min(width, height) // 3
    logo = create_app_icon(logo_size)
    
    logo_x = (width - logo_size) // 2
    logo_y = (height - logo_size) // 2 - height // 10
    
    img.paste(logo, (logo_x, logo_y))
    
    # Add app name
    try:
        font_size = width // 12
        font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', font_size)
    except:
        font = ImageFont.load_default()
    
    text = "L2 Orderbook"
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    
    text_x = (width - text_width) // 2
    text_y = logo_y + logo_size + height // 20
    
    draw.text((text_x, text_y), text, fill='#ffffff', font=font)
    
    # Add loading indicator
    indicator_y = text_y + height // 10
    indicator_width = width // 3
    indicator_x = (width - indicator_width) // 2
    
    draw.rectangle(
        [indicator_x, indicator_y, indicator_x + indicator_width, indicator_y + 4],
        fill='#374151'
    )
    draw.rectangle(
        [indicator_x, indicator_y, indicator_x + indicator_width // 2, indicator_y + 4],
        fill='#3b82f6'
    )
    
    return img

def main():
    """Generate all required icons and splash screens"""
    output_dir = 'client/public'
    os.makedirs(output_dir, exist_ok=True)
    
    # Icon sizes for PWA
    icon_sizes = [
        (192, 'icon-192.png'),
        (512, 'icon-512.png'),
        (180, 'apple-touch-icon.png'),  # iOS
        (152, 'icon-152.png'),  # iPad
        (120, 'icon-120.png'),  # iPhone
        (76, 'icon-76.png'),   # iPad
    ]
    
    print("Generating app icons...")
    for size, filename in icon_sizes:
        icon = create_app_icon(size)
        filepath = os.path.join(output_dir, filename)
        icon.save(filepath, 'PNG', optimize=True)
        print(f"  Created {filename} ({size}x{size})")
    
    # Splash screens for iOS
    splash_sizes = [
        (1170, 2532, 'splash-1170x2532.png'),  # iPhone 12/13/14 Pro
        (1125, 2436, 'splash-1125x2436.png'),  # iPhone X/XS/11 Pro
        (1242, 2688, 'splash-1242x2688.png'),  # iPhone XS Max/11 Pro Max
        (828, 1792, 'splash-828x1792.png'),    # iPhone XR/11
        (1536, 2048, 'splash-1536x2048.png'),  # iPad
        (2048, 2732, 'splash-2048x2732.png'),  # iPad Pro
    ]
    
    print("\nGenerating splash screens...")
    for width, height, filename in splash_sizes:
        splash = create_splash_screen(width, height)
        filepath = os.path.join(output_dir, filename)
        splash.save(filepath, 'PNG', optimize=True)
        print(f"  Created {filename} ({width}x{height})")
    
    # Create favicon.ico with multiple sizes
    print("\nGenerating favicon...")
    favicon_sizes = [16, 32, 48, 64]
    favicon_images = [create_app_icon(size) for size in favicon_sizes]
    favicon_images[0].save(
        os.path.join(output_dir, 'favicon.ico'),
        format='ICO',
        sizes=[(size, size) for size in favicon_sizes]
    )
    print("  Created favicon.ico")
    
    print("\n✅ All icons and splash screens generated successfully!")
    print(f"📁 Output directory: {output_dir}")
    print("\n📱 To use:")
    print("1. Icons are ready for PWA manifest")
    print("2. Splash screens are linked in index.html")
    print("3. Run 'npm start' to see the mobile app")

if __name__ == '__main__':
    # Check if Pillow is installed
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("❌ Pillow not installed. Installing...")
        import subprocess
        subprocess.check_call(['pip3', 'install', 'Pillow'])
        from PIL import Image, ImageDraw, ImageFont
    
    main()
