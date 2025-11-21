"""MVola (Telma) — sandbox https://devapi.mvola.mg

Docs: https://www.mvola.mg/devportal (OAuth2 client_credentials + REST).
"""
import base64
import uuid
from datetime import datetime, timezone

from django.conf import settings

from .base import BaseProvider, CallbackResult, InitiateResult, ProviderError

SANDBOX_BASE = 'https://devapi.mvola.mg'
TOKEN_PATH = '/token'
MERCHANT_PAY_PATH = '/mvola/mm/transactions/type/merchantpay/1.0.0/'


class MVolaProvider(BaseProvider):
    name = 'mvola'

    def __init__(self):
        cfg = settings.TSOTRA_MVOLA
        self.base_url = cfg.get('BASE_URL', SANDBOX_BASE)
        self.consumer_key = cfg.get('CONSUMER_KEY', '')
        self.consumer_secret = cfg.get('CONSUMER_SECRET', '')
        self.partner_msisdn = cfg.get('PARTNER_MSISDN', '')
        self.partner_name = cfg.get('PARTNER_NAME', 'tsotra')

    def _token(self) -> str:
        import requests
        if not (self.consumer_key and self.consumer_secret):
            raise ProviderError('MVola credentials manquantes (CONSUMER_KEY/SECRET).')
        creds = f'{self.consumer_key}:{self.consumer_secret}'.encode()
        b64 = base64.b64encode(creds).decode()
        resp = requests.post(
            f'{self.base_url}{TOKEN_PATH}',
            headers={
                'Authorization': f'Basic {b64}',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-cache',
            },
            data={'grant_type': 'client_credentials', 'scope': 'EXT_INT_MVOLA_SCOPE'},
            timeout=15,
        )
        if resp.status_code != 200:
            raise ProviderError(f'MVola token: {resp.status_code} {resp.text}')
        return resp.json()['access_token']

    def initiate(self, *, amount_mga, msisdn, internal_reference,
                 description, callback_url):
        import requests
        token = self._token()
        now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        body = {
            'amount': str(amount_mga),
            'currency': 'Ar',
            'descriptionText': description[:50],
            'requestDate': now,
            'debitParty': [{'key': 'msisdn', 'value': msisdn}],
            'creditParty': [{'key': 'msisdn', 'value': self.partner_msisdn}],
            'metadata': [
                {'key': 'partnerName', 'value': self.partner_name},
                {'key': 'fc', 'value': 'USD'},
                {'key': 'amountFc', 'value': '1'},
            ],
            'requestingOrganisationTransactionReference': internal_reference,
            'originalTransactionReference': internal_reference,
        }
        headers = {
            'Authorization': f'Bearer {token}',
            'Version': '1.0',
            'X-CorrelationID': str(uuid.uuid4()),
            'UserLanguage': 'FR',
            'UserAccountIdentifier': f'msisdn;{self.partner_msisdn}',
            'partnerName': self.partner_name,
            'X-Callback-URL': callback_url,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        }
        resp = requests.post(
            f'{self.base_url}{MERCHANT_PAY_PATH}',
            headers=headers, json=body, timeout=20,
        )
        if resp.status_code not in (200, 202):
            raise ProviderError(f'MVola initiate: {resp.status_code} {resp.text}')
        data = resp.json()
        return InitiateResult(
            provider_reference=data.get('serverCorrelationId', ''),
            instructions=(
                'Confirmez le paiement sur votre téléphone MVola '
                '(notification push ou code USSD).'
            ),
            raw=data,
        )

    def parse_callback(self, payload):
        # MVola pousse un payload contenant transactionStatus + serverCorrelationId
        status = (payload.get('transactionStatus') or '').lower()
        return CallbackResult(
            provider_reference=payload.get('serverCorrelationId', ''),
            success=status == 'completed',
            failure_reason='' if status == 'completed' else status or 'unknown',
            raw=payload,
        )
