// WebAuthn functionality test script
// This script tests the Tauri commands for WebAuthn

// Setup: Make sure to run this in the COS72-Tauri app context
const { invoke } = window.__TAURI__.tauri;

// Test functions
async function testWebAuthnSupport() {
  console.log("=== Testing WebAuthn Support ===");
  try {
    const supported = await invoke("webauthn_supported");
    console.log("WebAuthn supported:", supported);
    
    const biometricSupported = await invoke("webauthn_biometric_supported");
    console.log("Biometric supported:", biometricSupported);
    
    return { supported, biometricSupported };
  } catch (error) {
    console.error("Error testing WebAuthn support:", error);
    return { error: error.toString() };
  }
}

async function testRegistration(username) {
  console.log(`=== Testing Registration for "${username}" ===`);
  try {
    // Start registration process
    console.log("Starting registration...");
    const regStart = await invoke("webauthn_start_registration", { username });
    console.log("Registration started:", regStart);
    
    if (!regStart || !regStart.challenge || !regStart.user_id) {
      throw new Error("Invalid registration start response");
    }
    
    // Use the challenge to create credentials via browser API
    console.log("Creating credential with WebAuthn browser API...");
    const credential = await createCredential(regStart.challenge);
    console.log("Credential created:", credential);
    
    // Finish registration
    console.log("Finishing registration...");
    const regFinish = await invoke("webauthn_finish_registration", {
      userId: regStart.user_id,
      response: JSON.stringify(credential)
    });
    console.log("Registration finished:", regFinish);
    
    return { 
      userId: regStart.user_id,
      credential: credential.id,
      result: regFinish
    };
  } catch (error) {
    console.error("Error in registration process:", error);
    return { error: error.toString() };
  }
}

async function testAuthentication(userId) {
  console.log(`=== Testing Authentication for user ID "${userId}" ===`);
  try {
    // Get credentials for this user
    console.log("Getting user credentials...");
    const credentials = await invoke("webauthn_get_credentials", { userId });
    console.log("User credentials:", credentials);
    
    // Create a challenge for authentication
    console.log("Creating authentication challenge...");
    const challenge = "test_challenge_" + Date.now();
    const authChallenge = await invoke("verify_passkey", { challenge });
    console.log("Authentication challenge created:", authChallenge);
    
    if (!authChallenge || !authChallenge.signature) {
      throw new Error("Invalid authentication challenge response");
    }
    
    // At this point the user would have been prompted to verify with their biometric
    // Get the authentication assertion
    console.log("Getting authentication assertion...");
    const assertion = await getAssertion(authChallenge.signature);
    console.log("Assertion received:", assertion);
    
    // Finish authentication
    console.log("Finishing authentication...");
    const authFinish = await invoke("webauthn_finish_authentication", {
      response: JSON.stringify(assertion)
    });
    console.log("Authentication finished:", authFinish);
    
    return {
      challenge,
      result: authFinish
    };
  } catch (error) {
    console.error("Error in authentication process:", error);
    return { error: error.toString() };
  }
}

// Helper functions for WebAuthn browser API

// Convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Use browser API to create a credential
async function createCredential(options) {
  // Parse challenge string if it's stringified JSON
  let parsedOptions;
  try {
    parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
  } catch (e) {
    console.error("Failed to parse options:", e);
    throw new Error("Invalid options format");
  }
  
  // Prepare the publicKey options for navigator.credentials.create
  const publicKeyOptions = {
    challenge: base64urlToArrayBuffer(parsedOptions.challenge || parsedOptions.publicKey?.challenge),
    rp: parsedOptions.rp,
    user: {
      ...parsedOptions.user,
      id: new TextEncoder().encode(parsedOptions.user?.id || "test-user")
    },
    pubKeyCredParams: parsedOptions.pubKeyCredParams || [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 } // RS256
    ],
    timeout: parsedOptions.timeout || 60000,
    attestation: parsedOptions.attestation || "none",
    authenticatorSelection: parsedOptions.authenticatorSelection || {
      userVerification: "preferred",
      authenticatorAttachment: "platform"
    }
  };
  
  console.log("Creating credential with options:", publicKeyOptions);
  
  // Call the browser API
  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions
    });
    
    // Format the credential for transport
    return {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
        clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
      }
    };
  } catch (e) {
    console.error("Error creating credential:", e);
    throw e;
  }
}

// Use browser API to get an assertion (authenticate)
async function getAssertion(options) {
  // Parse challenge string if it's stringified JSON
  let parsedOptions;
  try {
    parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
  } catch (e) {
    console.error("Failed to parse options:", e);
    throw new Error("Invalid options format");
  }
  
  // Prepare the publicKey options for navigator.credentials.get
  const publicKeyOptions = {
    challenge: base64urlToArrayBuffer(parsedOptions.challenge || "test-challenge"),
    timeout: parsedOptions.timeout || 60000,
    userVerification: parsedOptions.userVerification || "preferred"
  };
  
  // If there are allowCredentials, add them
  if (parsedOptions.allowCredentials && parsedOptions.allowCredentials.length > 0) {
    publicKeyOptions.allowCredentials = parsedOptions.allowCredentials.map(cred => ({
      id: base64urlToArrayBuffer(cred.id),
      type: cred.type
    }));
  }
  
  console.log("Getting assertion with options:", publicKeyOptions);
  
  // Call the browser API
  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions
    });
    
    // Format the assertion for transport
    return {
      id: assertion.id,
      rawId: Array.from(new Uint8Array(assertion.rawId)),
      type: assertion.type,
      response: {
        authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
        clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
        signature: Array.from(new Uint8Array(assertion.response.signature)),
        userHandle: assertion.response.userHandle ? 
          Array.from(new Uint8Array(assertion.response.userHandle)) : null
      }
    };
  } catch (e) {
    console.error("Error getting assertion:", e);
    throw e;
  }
}

// Run tests
async function runTests() {
  const results = {
    support: await testWebAuthnSupport(),
    timestamp: new Date().toISOString()
  };
  
  if (results.support.supported) {
    // Generate a random username for testing
    const username = "test_user_" + Math.floor(Math.random() * 10000);
    
    // Test registration
    results.registration = await testRegistration(username);
    
    // Test authentication
    if (!results.registration.error && results.registration.userId) {
      results.authentication = await testAuthentication(results.registration.userId);
    }
  }
  
  // Log and download results
  console.log("=== Test Results ===", results);
  
  // Prepare results for download
  const resultsBlob = new Blob([JSON.stringify(results, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(resultsBlob);
  
  // Create a download link
  const a = document.createElement('a');
  a.href = url;
  a.download = `passkey-test-result-${new Date().toISOString().replace(/:/g, '-')}.json`;
  a.click();
  
  return results;
}

// Export test functions for browser console use
window.testWebAuthn = {
  runTests,
  testWebAuthnSupport,
  testRegistration,
  testAuthentication
};

// Auto-run if in test mode
if (window.location.search.includes('autorun=true')) {
  runTests().catch(console.error);
} 