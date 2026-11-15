const form = document.querySelector("#waiver-form");
const ageInput = form.elements.age;
const guardianNote = document.querySelector("#guardian-note");
const guardianConsent = document.querySelector("#guardian-consent");
const guardianInput = form.elements.guardian;
const acceptedInput = form.elements.accepted;
const message = document.querySelector("#form-message");
const button = document.querySelector("#submit-button");
const RECIPIENTS = ["bido.nader@gmail.com", "bunker@makasibea.com"];

ageInput.addEventListener("input", () => {
  ageInput.setCustomValidity(ageInput.value && Number(ageInput.value) < 7 ? "The minimum age to participate is 7." : "");
});

function updateMinorFields() {
  const isMinor = Number(ageInput.value) > 0 && Number(ageInput.value) < 12;
  guardianNote.hidden = !isMinor;
  guardianConsent.hidden = !isMinor;
  guardianInput.required = isMinor;
}

function updateSubmitState() {
  const validDetails = form.elements.name.value.trim().length > 0
    && Number(ageInput.value) >= 7
    && Number(ageInput.value) <= 120
    && form.elements.phone.value.trim().length > 0;
  button.disabled = !validDetails || !acceptedInput.checked || (guardianInput.required && !guardianInput.checked);
}

ageInput.addEventListener("input", updateMinorFields);
form.addEventListener("input", updateSubmitState);
form.addEventListener("change", updateSubmitState);
updateSubmitState();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.classList.remove("success");
  if (!acceptedInput.checked) {
    message.textContent = "Please accept the waiver terms before submitting.";
    acceptedInput.focus();
    return;
  }
  if (!form.reportValidity()) return;

  const data = Object.fromEntries(new FormData(form).entries());
  data.age = Number(data.age);
  data.accepted = form.elements.accepted.checked;
  data.guardian = form.elements.guardian.checked;
  button.disabled = true;
  button.firstChild.textContent = "Submitting… ";

  try {
    const payload = {
      _subject: "Bunker Arcade — Mechanical Bull Waiver",
      _template: "table",
      _captcha: "false",
      name: data.name.trim(),
      age: data.age,
      phone: data.phone.trim(),
      waiverAccepted: data.accepted ? "Yes" : "No",
      parentOrGuardianConsent: data.guardian ? "Yes" : "No",
      safetyGear: form.elements.safetyGear.checked ? "Participant chose to wear the provided safety gear" : "Participant chose not to wear the provided safety gear",
      submittedAt: new Date().toISOString(),
    };
    const results = await Promise.allSettled(RECIPIENTS.map(async (email) => {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === "false") throw new Error(result.message || "Could not submit the waiver.");
    }));
    if (results.every((result) => result.status === "rejected")) throw new Error("Could not send the waiver. Check your connection and try again.");
    message.textContent = "Waiver submitted. Thank you!";
    message.classList.add("success");
    form.reset();
    updateMinorFields();
    updateSubmitState();
  } catch (error) {
    message.textContent = error.message || "Something went wrong. Please try again.";
  } finally {
    button.firstChild.textContent = "Submit waiver ";
    updateSubmitState();
  }
});
