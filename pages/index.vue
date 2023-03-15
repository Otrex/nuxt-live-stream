<template>
  <div class="w-full h-screen flex flex-row">
    <div class="w-1/2 bg-hero h-full"></div>
    <div class="w-1/2 flex items-center">
      <div class="pl-5 md:w-2/3"> 
        <span id="logo" class="text-lg font-extrabold italic text-gray-50 bg-black px-3 py-2 border-b"> Connect * </span>
        <h1 class="text-5xl my-3 font-bold">Connect with Your Loved Ones!!</h1>
        <h3 class="md:w-2/3">At the click of the button, you can conect to anyone all around the world.</h3>
        <NuxtLink id="connect" class="mt-5 inline-block bg-orange-900 text-white font-bold py-2 px-3" to="/main"> Get Started!! </NuxtLink>
      </div>
    </div>
  </div>
</template>
<style scoped>
.bg-hero {
  background-image: url(../assets/img/bg.jpg);
  background-size: cover;
  background-position-x: -100px;
}
</style>