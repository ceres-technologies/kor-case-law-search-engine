import json
import os


class CONFIG:
    data = None

    @classmethod
    def __class_getitem__(cls, key):
        if cls.data is None:
            path = str(os.path.abspath(os.path.dirname(__file__)))
            with open(path + "/config.json", "rt", encoding="UTF8") as f:
                cls.data = json.load(f)
        return cls.data[key]
