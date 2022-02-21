import logging
import unittest

from . import ingestion_logging


class LoggingTests(unittest.TestCase):
    def testCanLogInfoMessages(self):
        logger = ingestion_logging.getLogger(__name__)
        assert(logger.isEnabledFor(logging.INFO) is True)
    
    def testCanLogDebugMessages(self):
        logger = ingestion_logging.getLogger(__name__)
        assert(logger.isEnabledFor(logging.DEBUG) is True)
