<script lang="ts">
  import CloseIcon from "../assets/close.svg";
  import { helpVisible } from "../stores/stores";

  // Function to close the help modal
  function handleClose() {
    helpVisible.set(false);
  }
</script>

<div class="fixed z-50 inset-0 overflow-y-auto animate-fade-in">
  <div class="flex items-center justify-center min-h-screen">
    <div
      class="bg-primary text-white rounded-lg shadow-xl p-8 relative max-w-lg mx-4"
    >
      <button
        class="absolute top-0 right-0 mt-2 mr-2 text-gray-500 hover:text-gray-600"
        on:click={handleClose}
      >
        <img class="icon-white w-8" alt="Close" src={CloseIcon} />
      </button>
      <h2 class="text-xl font-bold mb-4">Pomoc</h2>
      <div class="text-left">
        <h1 class="text-3xl font-bold mb-4">Czym jest SemioGPT?</h1>
        <p class="mb-4">
          SemioGPT to narzędzie, które przeznaczone jest do analizy i
          modelowania procesów semiotycznych w kontekście komunikacji wizualnej.
          W przeciwieństwie do innych systemów, takich jak ChatGPT, które
          umożliwiają interakcje w formie tekstowej, SemioGPT oferuje możliwość
          przetwarzania różnych form znaków w ramach złożonych struktur
          semantycznych.
        </p>
        <p class="mb-4">
          <strong
            >SemioGPT wprowadza nową perspektywę analizy komunikacji wizualnej!</strong
          > System ten umożliwia nie tylko analizowanie danych, ale również tworzenie
          nowych komunikatów opartych na znakach i symbolach, które mają istotne
          znaczenie w kontekście kulturowym.
        </p>

        <p class="mb-4">
          <strong>Uwagi dotyczące przechowywania danych:</strong> Jeśli opuścisz
          stronę w trakcie przesyłania odpowiedzi, dane mogą zostać utracone. W przypadku
          odświeżenia strony pliki MP3 TTS zostaną usunięte, ale konwersacje pozostaną.
          Wygenerowane obrazy będą dostępne tylko przez 60 minut. Wyczyść pamięć
          podręczną przeglądarki, a wszystkie dane zostaną usunięte. Możesz pobrać
          sesję lokalnie i przywrócić ją w dowolnym momencie.
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  @import "../styles/settings.css";
</style>
