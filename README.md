# Bunker Arcade Mechanical Bull Waiver

Minimal bilingual waiver page built with plain HTML, CSS, and JavaScript. The form uses FormSubmit's AJAX endpoint, like the supplied reference page, to email submissions to both configured recipients.

## Configure submissions

Submissions are sent to `bido.nader@gmail.com` and `bunker@makasibea.com` through FormSubmit. Each recipient must confirm FormSubmit's initial activation email before submissions will arrive there. The browser sends the waiver fields, acceptance state, and submission time directly to FormSubmit; no database copy is kept.

## Deploy

1. Push this folder to a GitHub repository, or import it in Vercel using the Vercel CLI.
2. In Vercel, import the repository. Choose **Other** as the framework preset; no build command or output directory is needed.
3. Add the environment variables above and deploy. Redeploy after changing environment variables.

The form asks for name, age, phone number, waiver acceptance, and—when age is under 18—parent/guardian consent.
