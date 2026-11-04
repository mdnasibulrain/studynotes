NSPAY — StudyNotes Matched Payment Page

Updates in this version:
1. Clicking Submit Payment Details opens WhatsApp with the payment message pre-filled, while keeping the NSPAY page open on the Thank You / Order Summary screen. Returning from WhatsApp shows the same summary.
2. Make Another Payment navigates to the StudyNotes storefront path /nspay.

Important WhatsApp limitation: the browser cannot send a WhatsApp message silently. The customer must tap Send inside WhatsApp. If the browser blocks the WhatsApp popup, use the WhatsApp button shown on the Thank You screen.

Existing payment methods, QR payload/configuration, query parameters, form validation, screenshot selection, PDF receipt, and existing payment flow are preserved. Payment remains pending manual verification; no automatic payment verification is performed.

Deploy as the NSPAY payment page file. Confirm that https://YOUR-DOMAIN/nspay is your StudyNotes storefront route before publishing, because Make Another Payment now goes to that exact path. Test on Android: select method, complete form, submit, send WhatsApp message, return to NSPAY, verify summary and PDF receipt, then tap Make Another Payment.


Order signal: after a successful Submit Payment Details, this page writes a small 'sn_order_done' marker (localStorage) so the StudyNotes storefront (same domain) can clear the customer's cart only after the order has been handed off. Old links to /paysn/ redirect to /nspay/.
