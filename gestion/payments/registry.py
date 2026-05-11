from .airtel import AirtelProvider
from .base import BaseProvider, ProviderError
from .mvola import MVolaProvider
from .orange import OrangeProvider

_PROVIDERS = {
    'mvola': MVolaProvider,
    'orange': OrangeProvider,
    'airtel': AirtelProvider,
}


def get_provider(name: str) -> BaseProvider:
    cls = _PROVIDERS.get(name)
    if cls is None:
        raise ProviderError(f"Provider inconnu: {name!r}")
    return cls()
