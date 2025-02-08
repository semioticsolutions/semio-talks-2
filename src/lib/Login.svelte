<script>
  import { assistants, loggedInUser, selectedModel } from "../stores/stores";
  import { getAssistants } from "../services/openaiService";

  let availableAssistants = [];

  const refreshAssistants = () => {
    availableAssistants =
      $loggedInUser && $loggedInUser.assistants
        ? $assistants.filter((assistant) => {
            const isIncluded = $loggedInUser.assistants.includes(
              assistant.name
            );
            console.log(`Checking assistant ${assistant.name}: ${isIncluded}`);
            return isIncluded;
          })
        : [];
  };

  let email = "";
  let password = "";
  let loginError = "";
  import { onMount } from "svelte";

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  onMount(() => {
    const savedUser = localStorage.getItem("loggedInUser");
    if (savedUser) {
      loggedInUser.set(JSON.parse(savedUser));
    }
  });

  const login = async () => {
    if (!validateEmail(email)) {
      loginError = "Proszę podać poprawny adres e-mail.";
      return;
    }
    if (!password) {
      loginError = "Hasło nie może być puste.";
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Błąd logowania");
      }

      // Zapisz token i podstawowe dane użytkownika
      const user = {
        email,
        token: data.token,
        assistants: data.assistants,
      };

      loggedInUser.set(user);
      localStorage.setItem("loggedInUser", JSON.stringify(user));

      loginError = "";
    } catch (error) {
      console.error("Błąd logowania:", error);
      loginError = error.message || "Wystąpił błąd podczas logowania";
    }

    await getAssistants();
    await refreshAssistants();

    if ($selectedModel === "") {
      selectedModel.set(availableAssistants[0].name);
    }
  };

  const register = async () => {
    if (!validateEmail(email)) {
      loginError = "Proszę podać poprawny adres e-mail.";
      return;
    }
    if (!password) {
      loginError = "Hasło nie może być puste.";
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Błąd rejestracji");
      }

      loginError = "Rejestracja udana! Możesz się teraz zalogować.";
    } catch (error) {
      console.error("Błąd rejestracji:", error);
      loginError = error.message || "Wystąpił błąd podczas rejestracji";
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      login();
    }
  };
</script>

{#if $loggedInUser === null}
  <div class="login-container" on:keydown={handleKeyPress}>
    <div class="login-box">
      <label>
        <input type="email" bind:value={email} placeholder="Wpisz email" />
      </label>
      <label>
        <input
          type="password"
          bind:value={password}
          placeholder="Wpisz hasło"
        />
      </label>
      <div class="button-group">
        <button on:click={login} tabindex="0">Zaloguj</button>
        <button on:click={register} class="register-btn" tabindex="0">
          Zarejestruj
        </button>
      </div>
      {#if loginError}
        <div class="error">{loginError}</div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .login-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    color: white;
    font-family: Arial, sans-serif;
  }
  .login-box {
    background: #333;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    text-align: center;
    width: 100%;
    max-width: 400px;
  }
  .login-box input {
    width: 100%;
    margin: 10px 0;
    padding: 10px;
    font-size: 1rem;
    border: 1px solid #555;
    border-radius: 5px;
    background: #222;
    color: white;
  }
  .button-group {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  .login-box button {
    flex: 1;
    padding: 10px;
    font-size: 1rem;
    background: #007bff;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
  }
  .register-btn {
    background: #28a745 !important;
  }
  .login-box button:hover {
    opacity: 0.9;
  }
  .error {
    color: #ff4d4d;
    margin-top: 10px;
  }
</style>
