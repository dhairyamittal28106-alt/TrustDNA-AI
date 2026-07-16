import secrets
import time
from uuid import UUID


def uuid7() -> UUID:
    """Create a sortable UUIDv7 compatible with Python 3.12."""
    timestamp_ms = int(time.time() * 1000)
    random_bits = secrets.randbits(74)
    value = (timestamp_ms << 80) | (0x7 << 76) | (random_bits & ((1 << 76) - 1))
    value &= ~(0b11 << 62)
    value |= 0b10 << 62
    return UUID(int=value)
