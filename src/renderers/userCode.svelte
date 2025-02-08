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
 {text}
</div>

<style>




  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }


</style>
