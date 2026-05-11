"""Orange Money Web Payment — sandbox developer.orange.com

Docs: https://developer.orange.com/apis/om-webpay (OAuth2 + Web Payment).
"""
from django.conf import settings

from .base import BaseProvider, CallbackResult, InitiateResult, ProviderError

SANDBOX_BASE = 'https://api.orange.com'
TOKEN_PATH = '/oauth/v3/token'
WEBPAY_PATH = '/orange-money-webpay/dev/v1/webpayment'


class OrangeProvider(BaseProvider):
    name = 'orange'

    def __init__(self):
        cfg = settings.TSOTRA_ORANGE
        self.base_url = cfg.get('BASE_URL', SANDBOX_BASE)
        self.auth_header = cfg.get('AUTH_HEADER', '')        # "Basic xxxxxx"
        self.merchant_key = cfg.get('MERCHANT_KEY', '')
        self.return_url = cfg.get('RETURN_URL', '')
        self.cancel_url = cfg.get('CANCEL_URL', '')

    def _token(self) -> str:
        import requests
        if not self.auth_header:
            raise ProviderError('Orange AUTH_HEADER manquant.')
        resp = requests.post(
            f'{self.base_url}{TOKEN_PATH}',
            headers={
                'Authorization': self.auth_header,
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data={'grant_type': 'client_credentials'},
            timeout=15,
        )
        if resp.status_code != 200:
            raise ProviderError(f'Orange token: {resp.status_code} {resp.text}')
        return resp.json()['access_token']

    def initiate(self, *, amount_mga, msisdn, internal_reference,
                 description, callback_url):
        import requests
        if not self.merchant_key:
            raise ProviderError('Orange MERCHANT_KEY manquant.')
        token = self._token()
        body = {
            'merchant_key': self.merchant_key,
            'currency': 'OUV',          # sandbox: "OUV" — prod MG: "MGA"
            'order_id': internal_reference,
            'amount': amount_mga,
            'return_url': self.return_url,
            'cancel_url': self.cancel_url,
            'notif_url': callback_url,
            'lang': 'fr',
            'reference': description[:50],
        }
        resp = requests.post(
            f'{self.base_url}{WEBPAY_PATH}',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json=body, timeout=20,
        )
        if resp.status_code not in (200, 201):
            raise ProviderError(f'Orange initiate: {resp.status_code} {resp.text}')
        data = resp.json()
        return InitiateResult(
            provider_reference=data.get('pay_token', ''),
            payment_url=data.get('payment_url', ''),
            instructions=(
                "Vous allez être redirigé vers la page Orange Money "
                "pour confirmer le paiement."
            ),
            raw=data,
        )

    def parse_callback(self, payload):
        # Orange notif: status = "SUCCESS" / "FAILED" / "EXPIRED" / "INITIATED"
        status = (payload.get('status') or '').upper()
        return CallbackResult(
            provider_reference=payload.get('pay_token') or payload.get('txnid', ''),
            success=status == 'SUCCESS',
            failure_reason='' if status == 'SUCCESS' else status or 'unknown',
            raw=payload,
        )
