"""Airtel Money — sandbox https://openapiuat.airtel.africa

Docs: https://developers.airtel.africa (OAuth2 + Collections / Merchant Payment).
"""
from django.conf import settings

from .base import BaseProvider, CallbackResult, InitiateResult, ProviderError

SANDBOX_BASE = 'https://openapiuat.airtel.africa'
TOKEN_PATH = '/auth/oauth2/token'
COLLECT_PATH = '/merchant/v1/payments/'


class AirtelProvider(BaseProvider):
    name = 'airtel'

    def __init__(self):
        cfg = settings.TSOTRA_AIRTEL
        self.base_url = cfg.get('BASE_URL', SANDBOX_BASE)
        self.client_id = cfg.get('CLIENT_ID', '')
        self.client_secret = cfg.get('CLIENT_SECRET', '')
        self.country = cfg.get('COUNTRY', 'MG')
        self.currency = cfg.get('CURRENCY', 'MGA')

    def _token(self) -> str:
        import requests
        if not (self.client_id and self.client_secret):
            raise ProviderError('Airtel credentials manquantes.')
        resp = requests.post(
            f'{self.base_url}{TOKEN_PATH}',
            headers={
                'Accept': '*/*',
                'Content-Type': 'application/json',
            },
            json={
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'grant_type': 'client_credentials',
            },
            timeout=15,
        )
        if resp.status_code != 200:
            raise ProviderError(f'Airtel token: {resp.status_code} {resp.text}')
        return resp.json()['access_token']

    def initiate(self, *, amount_mga, msisdn, internal_reference,
                 description, callback_url):
        import requests
        token = self._token()
        body = {
            'reference': description[:50],
            'subscriber': {
                'country': self.country,
                'currency': self.currency,
                'msisdn': msisdn,
            },
            'transaction': {
                'amount': amount_mga,
                'country': self.country,
                'currency': self.currency,
                'id': internal_reference,
            },
        }
        headers = {
            'Authorization': f'Bearer {token}',
            'X-Country': self.country,
            'X-Currency': self.currency,
            'Content-Type': 'application/json',
            'Accept': '*/*',
        }
        resp = requests.post(
            f'{self.base_url}{COLLECT_PATH}',
            headers=headers, json=body, timeout=20,
        )
        if resp.status_code not in (200, 202):
            raise ProviderError(f'Airtel initiate: {resp.status_code} {resp.text}')
        data = resp.json()
        return InitiateResult(
            provider_reference=(data.get('data') or {}).get('transaction', {})
                                  .get('id', internal_reference),
            instructions=(
                'Confirmez le paiement Airtel Money sur votre téléphone '
                '(notification ou USSD).'
            ),
            raw=data,
        )

    def parse_callback(self, payload):
        # Airtel callback: transaction.status_code "TS" = success, "TF"/"TA" = fail
        tx = (payload.get('transaction') or {})
        code = (tx.get('status_code') or '').upper()
        return CallbackResult(
            provider_reference=tx.get('id', ''),
            success=code == 'TS',
            failure_reason='' if code == 'TS' else code or 'unknown',
            raw=payload,
        )
