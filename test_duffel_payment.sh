#!/bin/bash
source /Users/marquis/flybeth/backend/.env
curl -X POST "https://api.duffel.com/payments/payment_intents" \
  -H "Accept-Encoding: gzip" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Duffel-Version: v2" \
  -H "Authorization: Bearer $DUFFEL_API_KEY" \
  -d '{"data":{"amount":"1569.15","currency":"USD"}}'
