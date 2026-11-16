
const form = document.querySelector("#waiver-form");
const ageInput = form.elements.age;
const guardianNote = document.querySelector("#guardian-note");
const guardianConsent = document.querySelector("#guardian-consent");
const guardianInput = form.elements.guardian;
const acceptedInput = form.elements.accepted;
const message = document.querySelector("#form-message");
const button = document.querySelector("#submit-button");

const RECIPIENTS = [
  "bido.nader@gmail.com",
  "bunker@makasibea.com"
];

let isSubmitting = false;

// Minimum age validation
ageInput.addEventListener("input", () => {
  ageInput.setCustomValidity(
    ageInput.value && Number(ageInput.value) < 7
      ? "The minimum age to participate is 7."
      : ""
  );
});

// Show guardian fields for participants under 12
function updateMinorFields() {
  const isMinor =
    Number(ageInput.value) > 0 &&
    Number(ageInput.value) < 12;

  guardianNote.hidden = !isMinor;
  guardianConsent.hidden = !isMinor;
  guardianInput.required = isMinor;
}

// Update submit button availability
function updateSubmitState() {
  const validDetails =
    form.elements.name.value.trim().length > 0 &&
    Number(ageInput.value) >= 7 &&
    Number(ageInput.value) <= 120 &&
    form.elements.phone.value.trim().length > 0;

  button.disabled =
    isSubmitting ||
    !validDetails ||
    !acceptedInput.checked ||
    (guardianInput.required && !guardianInput.checked);
}

// Listen for form changes
ageInput.addEventListener("input", updateMinorFields);
form.addEventListener("input", updateSubmitState);
form.addEventListener("change", updateSubmitState);

updateMinorFields();
updateSubmitState();

// Submit waiver
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) return;

  message.textContent = "";
  message.classList.remove("success");

  // Validate acceptance
  if (!acceptedInput.checked) {
    message.textContent =
      "Please accept the waiver terms before submitting.";

    acceptedInput.focus();
    return;
  }

  // Validate all required fields
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(
    new FormData(form).entries()
  );

  data.age = Number(data.age);
  data.accepted = acceptedInput.checked;
  data.guardian = guardianInput.checked;

  // Lock submission button
  isSubmitting = true;
  button.disabled = true;
  button.firstChild.textContent = "Submitting… ";

  const payload = {
    _subject: "Bunker Arcade — Mechanical Bull Waiver",
    _template: "table",
    _captcha: "false",

    name: data.name.trim(),
    age: data.age,
    phone: data.phone.trim(),

    waiverAccepted: data.accepted ? "Yes" : "No",

    parentOrGuardianConsent:
      data.guardian ? "Yes" : "No",

    safetyGear: form.elements.safetyGear.checked
      ? "Participant chose to wear the provided safety gear"
      : "Participant chose not to wear the provided safety gear",

    submittedAt: new Date().toISOString()
  };

  // Timeout after 20 seconds
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    // Send to both recipients
    const results = await Promise.allSettled(
      RECIPIENTS.map(async (email) => {
        const response = await fetch(
          `https://formsubmit.co/ajax/${email}`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },

            body: JSON.stringify(payload),

            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => ({}));

        if (
          !response.ok ||
          result.success === false ||
          result.success === "false"
        ) {
          throw new Error(
            result.message || `Failed to send to ${email}`
          );
        }

        return email;
      })
    );

    // Check delivery results
    const successful = results.filter(
      result => result.status === "fulfilled"
    );

    const failed = results.filter(
      result => result.status === "rejected"
    );

    if (successful.length === RECIPIENTS.length) {
      message.textContent =
        "Waiver submitted successfully! Thank you.";

      message.classList.add("success");

      form.reset();

      updateMinorFields();

    } else if (successful.length > 0) {
      message.textContent =
        "Your waiver was only partially delivered. Please contact staff before submitting again.";

    } else {
      throw failed[0].reason ||
        new Error("Could not submit the waiver.");
    }

  } catch (error) {
    if (error.name === "AbortError") {
      message.textContent =
        "Submission timed out. Please check your connection and contact staff before retrying.";
    } else {
      message.textContent =
        error.message ||
        "Something went wrong. Please try again.";
    }

  } finally {
    clearTimeout(timeoutId);

    isSubmitting = false;

    button.firstChild.textContent = "Submit waiver ";

    updateSubmitState();
  }
});
