# Conference kit: the `/card` page and its QR

The card lives at https://michael-herron.vercel.app/card and the QR to show people at
https://michael-herron.vercel.app/card/qr. Both go live when you merge this branch into `main`.

## Using it Monday

1. On your phone, open https://michael-herron.vercel.app/card/qr in Safari.
2. Share → **Add to Home Screen**, so the QR is one tap away all day. Turn the screen brightness up when you show it.
3. The other person points their camera at the QR. It opens `/card` on their phone: your name, what you do, and
   three pieces of selected work.
4. They tap **Save contact**. An iPhone opens your contact card (name, title, email, site, LinkedIn, Durham, NC; no
   phone number) and adds you in one tap. Android usually downloads the file first; one more tap opens it in Contacts.
5. **No signal?** The home-screen icon needs the network. Fall back to LinkedIn's own QR: in the LinkedIn app, tap
   the QR icon in the search bar and show "My code". A screenshot of `/card/qr` in Photos also works, but the
   person scanning still needs signal to open the card.

From `/card` itself, **Show QR** opens the QR page and **← Back** returns to the card, so you can hand your phone to
someone either way.

## Checking it after the merge

Do this once the Vercel deploy of `main` finishes, before Monday:

1. On a laptop, open https://michael-herron.vercel.app/card/qr.png (the 1024 px PNG). Scan it with a second phone's
   camera. It must open `https://michael-herron.vercel.app/card?src=qr` and show the card.
2. On an iPhone, open `/card` and tap **Save contact**. iOS shows a contact preview: check the name, the title
   "Systems & Process Engineer", the email `mherron734@gmail.com`, the site and LinkedIn links, and that there is no
   phone number. Tap **Create New Contact**, then delete the test contact.
3. Open `/card/qr` on your own phone in a dim room and scan it from the second phone. It should lock on in about a
   second.
4. If anything is wrong, don't edit the QR files by hand: the URL comes from `src/lib/data/profile.ts`, and
   `npm run qr` regenerates `public/card/qr.svg` and `qr.png`. A test fails if the SVG drifts from the site URL; the
   PNG test checks only its size, which is why step 1 scans it.

## It keeps itself up to date

The "Selected work" list on `/card` is the first three projects marked `featured: true`, lowest `order` first, in
`src/lib/data/projects.ts`. A case study that merges with `featured` and a low enough `order` replaces one of them on
the next deploy; the card's code and the QR need no edits. The QR only changes if the site address changes.
