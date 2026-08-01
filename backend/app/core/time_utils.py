from datetime import datetime, timezone


def utcnow() -> datetime:
    """Naive UTC datetime, equivalent to the deprecated `datetime.utcnow()`.

    Kept naive (no tzinfo) so it stays comparable with existing naive
    `DateTime` columns and previously-stored values, while avoiding the
    deprecated `datetime.utcnow()` call itself.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)
