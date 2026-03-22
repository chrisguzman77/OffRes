import io
import base64
import json
import zlib
import qrcode
from qrcode.constants import ERROR_CORRECT_L


def compress_payload(data: str) -> str:
    compressed = zlib.compress(data.encode('utf-8'), level=9)
    return base64.urlsafe_b64encode(compressed).decode('utf-8')


def decompress_payload(data: str) -> str:
    compressed = base64.urlsafe_b64decode(data.encode('utf-8'))
    return zlib.decompress(compressed).decode('utf-8')


def generate_qr_code(data: str) -> str:
    compressed = compress_payload(data)

    # Level L minimizes module count for a given payload (here ~v12 vs ~v20 with H).
    # Fewer, larger modules scan far more reliably from another phone screen.
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_L,
        box_size=12,
        border=4,
    )
    qr.add_data(compressed)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return b64