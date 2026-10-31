PaySN — StudyNotes Matched Payment Page

Updates in this version:
1. Clicking Submit Payment Details opens WhatsApp with the payment message pre-filled, while keeping the PaySN page open on the Thank You / Order Summary screen. Returning from WhatsApp shows the same summary.
2. Make Another Payment navigates to the StudyNotes storefront path /paysn.

Important WhatsApp limitation: the browser cannot send a WhatsApp message silently. The customer must tap Send inside WhatsApp. If the browser blocks the WhatsApp popup, use the WhatsApp button shown on the Thank You screen.

Existing payment methods, QR payload/configuration, query parameters, form validation, screenshot selection, PDF receipt, and existing payment flow are preserved. Payment remains pending manual verification; no automatic payment verification is performed.

Deploy as the PaySN payment page file. Confirm that https://YOUR-DOMAIN/paysn is your StudyNotes storefront route before publishing, because Make Another Payment now goes to that exact path. Test on Android: select method, complete form, submit, send WhatsApp message, return to PaySN, verify summary and PDF receipt, then tap Make Another Payment.
