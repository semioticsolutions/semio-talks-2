<script>

  export let text;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Error copying text: ", error);
    }
  };
  
</script>

<div style="position:relative">
  <div class="copycode">
    <button on:click={copyToClipboard}>Copy code</button>
  </div>
  <!-- Wrap highlightedCode within <pre> and <code> -->
  <pre><code>{text}</code></pre>
</div>

<style>
  pre {
    background-color: #0d0d0d;
    border-radius: 0px 0px 10px 10px;
    padding: 20px;
    margin: 0 20px 0 20px; 
    opacity: 0;
    animation: fade-in 0.5s ease-in-out forwards;
    margin-bottom: 1rem;
    font-weight: bold;
    overflow-wrap: break-word;
    white-space: pre-wrap;
  }

  .copycode {
    display: flex;
    justify-content: flex-end;
    background-color: #2f2f2f;
    margin: 0 20px 0 20px;
    border-radius: 10px 10px 0px 0px;
    padding: 0.5rem 1rem 0.5rem 1rem;

  }
  button {
    font-size: small;
    display: block; 
    transition: all 0.1s ease-in-out;
    color: rgb(187, 187, 187);
  }

  button:hover {
    color: white;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }


</style>
