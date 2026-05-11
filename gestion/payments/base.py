"""Interface commune aux providers Mobile Money."""
from dataclasses import dataclass
from typing import Any


@dataclass
class InitiateResult:
    provider_reference: str
    payment_url: str = ''      # pour Orange Money (redirect)
    instructions: str = ''     # message à afficher au payeur (USSD/push)
    raw: dict[str, Any] | None = None


@dataclass
class CallbackResult:
    provider_reference: str
    success: bool
    failure_reason: str = ''
    raw: dict[str, Any] | None = None


class ProviderError(Exception):
    """Erreur d'appel à un provider Mobile Money."""


class BaseProvider:
    name: str = ''

    def initiate(self, *, amount_mga: int, msisdn: str,
                 internal_reference: str, description: str,
                 callback_url: str) -> InitiateResult:
        raise NotImplementedError

    def parse_callback(self, payload: dict) -> CallbackResult:
        raise NotImplementedError
