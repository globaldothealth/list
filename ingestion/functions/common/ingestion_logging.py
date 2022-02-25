import logging
import sys

handlers = set()

def getLogger(module_name):
    logger = logging.getLogger(module_name)
    logger.setLevel(logging.DEBUG)
    if not logger.hasHandlers():
        handler = logging.StreamHandler(stream=sys.stdout)
        handler.setLevel(logging.DEBUG)
        logger.addHandler(handler)
        handlers.add(handler)
    return logger

def flushAll():
    for handler in handlers:
        handler.flush()
