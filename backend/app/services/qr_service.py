"""
QR code generation service.
Takes a string payload and returns a base64-encoded PNG image.
"""

import io
import base64
import qrcode
from qrcode.constants import ERROR_CORRECT_M


def generate_qr_code(data: str) -> str:
    """
    Generate a QR code PNG from the given data string.
    Returns a base64-encoded PNG string suitable for embedding in HTML:
      <img src="data:image/png;base64,{returned_string}" />
    """
    qr = qrcode.QRCode(
        version=None,  # Auto-size based on data length
        error_correction=ERROR_CORRECT_M,  # ~15% error recovery
        box_size=8,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Create image with green-on-black theme to match our UI
    img = qr.make_image(fill_color="#00ff41", back_color="#0a0a0a")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return b64