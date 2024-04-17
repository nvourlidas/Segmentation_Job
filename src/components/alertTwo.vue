<template>
    <label>
<input type="checkbox" class="alertCheckbox" autocomplete="off" />
<div class="alert error">
  <span class="alertClose">X</span>
  <span class="alertText"> Audience ID is incorrect. Please try again.
      <br class="clear"/></span>
</div>
</label>
</template>

<style scoped>

.alert {
position: relative;
top: 10;
left: 0;
width: auto;
height: auto;
padding: 10px;
margin: 10px;
line-height: 1.8;
border-radius: 5px;
cursor: hand;
cursor: pointer;
font-family: sans-serif;
font-weight: 400;
}

.success {
background-color: #EFE;
border: 1px solid #DED;
color: rgb(5, 5, 5);
}

.error {
  background-color: #FEE;
  border: 1px solid #EDD;
  color: #A66;
}
.alertCheckbox {
display: none;
}

:checked + .alert {
display: none;
}

.alertText {
display: table;
margin: 0 auto;
text-align: center;
font-size: 16px;
}

.alertClose {
float: right;
padding-top: 5px;
font-size: 10px;
}
</style>