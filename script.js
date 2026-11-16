const form = document.querySelector("#waiver-form");
const ageInput = form.elements.age;
const guardianNote = document.querySelector("#guardian-note");
const guardianConsent = document.querySelector("#guardian-consent");
const guardianInput = form.elements.guardian;
const acceptedInput = form.elements.accepted;
const message = document.querySelector("#form-message");
const button = document.querySelector("#submit-button");

// Optional: add <span id="button-label">Submit waiver</span> inside the button.
// If it doesn't exist, we fall back to the button's first text node.
const buttonLabel = document.querySelector("#button-label");
const labelTarget = buttonLabel || button.firstChild;
const defaultLabel = labelTarget ? labelTarget.textContent : "Submit waiver ";

function setButtonLabel(text) {
  if (labelTarget) labelTarget.textContent = text;
}

// FormSubmit: first address receives the form, second one gets a copy (_cc)
const PRIMARY_RECIPIENT = "bido.nader@gmail.com";
const CC_RECIPIENT = "bunker@makasibea.com";

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

  const data = Object.fromEntries(new FormData(form).entries());

  data.age = Number(data.age);
  data.accepted = acceptedInput.checked;
  data.guardian = guardianInput.checked;

  // Lock submission button
  isSubmitting = true;
  button.disabled = true;
  setButtonLabel("Submitting… ");

  const payload = {
    _subject: "Bunker Arcade — Mechanical Bull Waiver",
    _template: "table",
    _captcha: "false",
    _cc: CC_RECIPIENT,

    name: data.name.trim(),
    age: data.age,
    phone: data.phone.trim(),

    waiverAccepted: data.accepted ? "Yes" : "No",

    parentOrGuardianConsent: data.guardian ? "Yes" : "No",

    safetyGear: form.elements.safetyGear.checked
      ? "Participant chose to wear the provided safety gear"
      : "Participant chose not to wear the provided safety gear",

    submittedAt: new Date().toISOString()
  };

  // Timeout after 20 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    // One request, with the second recipient in CC
    const response = await fetch(
      `https://formsubmit.co/ajax/${PRIMARY_RECIPIENT}`,
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

    // Debug: check the browser console to see what FormSubmit returned
    console.log("FormSubmit response:", response.status, result);

    if (!response.ok || String(result.success) !== "true") {
      throw new Error(
        result.message || "Could not submit the waiver. Please contact staff."
      );
    }

    message.textContent = "Waiver submitted successfully! Thank you.";
    message.classList.add("success");

    form.reset();
    updateMinorFields();

  } catch (error) {
    console.error("Waiver submit error:", error);

    if (error.name === "AbortError") {
      message.textContent =
        "Submission timed out. Please check your connection and contact staff before retrying.";
    } else {
      message.textContent =
        error.message || "Something went wrong. Please try again.";
    }

  } finally {
    clearTimeout(timeoutId);
    isSubmitting = false;
    setButtonLabel(defaultLabel);
    updateSubmitState();
  }
});
