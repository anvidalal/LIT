
var camera, container, lightHelper1, obj, renderer, scene, spotLight1;
var spotlights, lightHelpers;
var leeColors = [];
var peopleColors = [];
var savedCues = [];
var isLightHelperOn = true;
var isPickingColor = false;

var selectedSpotlightIndex;
var originalColor;
var selectedColor, selectedFilter;


var raycaster;
var mouse;

var WIDTH, HEIGHT;
var canvas;
var canvasPositon;

var outlineMaterial, outlineMesh;

var selectedObject, selectedObjCol;

var transformControls;

var people = [];

function setup() {

  container = $('#lightSimContainer');

  WIDTH = container.width();
  HEIGHT = window.innerHeight * 0.6;

  $("#color-swatch-wrapper").css("height", HEIGHT + "px");
   $("#color-person-wrapper").css("height", HEIGHT + "px");

  // set some camera attributes
  var VIEW_ANGLE = 60,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;

  // create a WebGL renderer, camera
  // and a scene
  renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true
  });
  renderer.domElement.setAttribute("id", "canvas");
  renderer.clearColor(0xEEEEEE);
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(
      VIEW_ANGLE,
      ASPECT,
      NEAR,
      FAR);

  scene = new THREE.Scene();
  // add the camera to the scene
  scene.add(camera);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  
  // create floor
  var textureLoader = new THREE.TextureLoader();
  var woodTexture = new THREE.TextureLoader().load( "assets/wood-floor.jpg" );
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set( 128, 128 );

  var geoFloor = new THREE.BoxGeometry(2000, 1, 2000);
  var matFloor = new THREE.MeshPhongMaterial({
    color: 0XC0834A,
    map: woodTexture
  });
  var mshFloor = new THREE.Mesh( geoFloor, matFloor );
  mshFloor.receiveShadow = true;
  scene.add( mshFloor );

  // create back wall
  var geoBackwall = new THREE.BoxGeometry(2000, 2000, 1);
  var matBackwall = new THREE.MeshPhongMaterial({
    color: 0XC0834A,
    map: woodTexture
  });
  var mshBackwall= new THREE.Mesh(geoBackwall, matBackwall);
  mshBackwall.receiveShadow = true;
  mshBackwall.position.set(0, 0, 170);
  //scene.add( mshBackwall );
  
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.load("assets/irongate_set.mtl", function( materials ) {
    materials.preload();
    
    var objLoader = new THREE.OBJLoader();
    objLoader.setMaterials( materials );
    objLoader.load("assets/irongate_set.obj", function (object) {
      object.children[0].geometry.computeBoundingBox();
      object.rotation.set(0,Math.PI,0);
      object.scale.set(4,4,4);
      object.position.set(0, -25, -300);
      object.traverse( function( node ) { if ( node instanceof THREE.Mesh ) { 
        node.castShadow = true;
        node.receiveShadow = true;
      }});
      scene.add(object);
    });
  });


  // create lights
 spotlights = [];
 lightHelpers = [];
 var spotlight_spacing = 450;
 var spotlight_height = 450;

 for (var i=0; i < 9; i++) {
  var spotlight = createSpotlight(0XFFFFFF, -1 * (i%3*spotlight_spacing - spotlight_spacing), 
    spotlight_height, 
    parseInt(i/3) * spotlight_spacing/3 - spotlight_spacing/3);

  spotlight.position.set(
    -1 * (i%3*spotlight_spacing - spotlight_spacing), 
    spotlight_height, 
    parseInt(i/3) * spotlight_spacing/3 - spotlight_spacing/3);

  spotlights.push(spotlight);
  scene.add(spotlights[i]);

  var lightHelper= new THREE.SpotLightHelper(spotlights[i]);
  lightHelpers.push(lightHelper);
  scene.add(lightHelpers[i]);
 }

  var ambient = new THREE.AmbientLight(0XFFFFFF, 0.5);
  scene.add(ambient);

  camera.position.set(15, 656, -1099);

  // Orbit Control
  orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  orbitControls.addEventListener('change', render, false);
  orbitControls.maxDistance = 2000;
  orbitControls.maxPolarAngle = Math.PI/2; 

  orbitControls.target.set(0, 40, 0);
 
  transformControls = new THREE.TransformControls( camera, renderer.domElement);
  transformControls.addEventListener( 'change', render );

  transformControls.addEventListener('mouseDown', function () {
    orbitControls.enabled = false;
  });
  transformControls.addEventListener('mouseUp', function () {
    orbitControls.enabled = true;
  });
  


  renderer.setSize(WIDTH, HEIGHT);
  container.append(renderer.domElement);

   $.getJSON("PEOPLE.json", function( data ) { 
      peopleColors = data;

  });

   $.getJSON("LEE_Color.json", function( data ) { 
      leeColors = data;

  });
  canvas = renderer.domElement;
  canvasPosition = $(canvas).position();

  canvas = renderer.domElement;
  canvasPosition = $(canvas).position();

  renderer.domElement.addEventListener('click', fullscreen, false);

  window.addEventListener('resize', onResize, false);
  onResize();

  $("#color-picker-card").hide();
  $("#person-color").hide();
  populateColorPickers();
  populateSlideBars();
  toggleLightHelpers();
  loadCues();

  $("#spinner-wrapper").css("display", "none");
  $("main").css("visibility", "visible");
}



function putSphere(color) {
  var radius = 16,
      segments = 16,
      rings = 16;

  // create the sphere's material
  var sphereMaterial =
    new THREE.MeshLambertMaterial(
      {
        color : color
      });

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      segments,
      rings),
    sphereMaterial);

  // add the sphere to the scene
  sphere.position.set(0, 61, 0);
  sphere.castShadow = true;
  scene.add(sphere);
  people.push(sphere);
  transformControls.attach( sphere );
  scene.add( transformControls );
  selectedObject = sphere;
  render();
}

function putSpecificSphere(color, x, y, z) {
  var radius = 16,
      segments = 16,
      rings = 16;

  // create the sphere's material
  var sphereMaterial =
    new THREE.MeshLambertMaterial(
      {
        color : color
      });

  var sphere = new THREE.Mesh(
    new THREE.SphereGeometry(
      radius,
      segments,
      rings),
    sphereMaterial);

  // add the sphere to the scene
  sphere.position.set(x, y, z);
  sphere.castShadow = true;
  scene.add(sphere);
  people.push(sphere);
  transformControls.attach( sphere );
  scene.add( transformControls );
  selectedObject = sphere;

  render();
}

function createSpotlight(color, x, y, z) {
  var newObj = new THREE.SpotLight(color, 0);
  newObj.castShadow = true;
  newObj.angle = 0.65;
  newObj.distance = 600;
  newObj.target = (x/2, y, z - 300);
  return newObj;
}

function onMouseMove( event ) {

  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components

  mouse.x = (((event.clientX - canvasPosition.left)/ canvas.width) * 2) - 1;
  mouse.y = (- ((event.clientY - canvasPosition.top) / canvas.height) * 2) + 1;
  transformControls.update();

}

function onMouseClick( event ) {
  canvas = renderer.domElement;
  canvasPosition = $(canvas).position();
  mouse.x = (((event.clientX - canvasPosition.left)/ canvas.width) * 2) - 1;
  mouse.y = (- ((event.clientY - canvasPosition.top) / canvas.height) * 2) + 1;
  if (mouse.x >= -1 && mouse.x <= 1 && mouse.y >= -1 && mouse.y <= 1)
  {
    raycast();
  }
}

function raycast() {
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( people );

  if (intersects.length > 0) {
                var distance = intersects[0].distance;;
        var closestObj = intersects[ 0 ].object;

        for (var i = 1; i < intersects.length; i++)
        {
          if (intersects[i].distance < distance)
          {
              distance = intersects[i].distance;
              closestObj = intersects[i].object;
          }
        }

        transformControls.attach(closestObj);
        selectedObject = closestObj;
  }

  else {
    transformControls.detach();
    selectedObject = null;
  }

  render();
}

function updateOutlineMesh() {
  if (selectedObject == null)
  {
    scene.remove(outlineMesh);
    outlineMesh = null;
    return;
  }
  scene.remove(outlineMesh);
  outlineMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.BackSide } );
  outlineMesh = new THREE.Mesh( selectedObject.geometry, outlineMaterial );
  outlineMesh.position.x = selectedObject.position.x;
  outlineMesh.position.y = selectedObject.position.y;
  outlineMesh.position.z = selectedObject.position.z;
  outlineMesh.scale.multiplyScalar(1.1);
  scene.add(outlineMesh);
}


function toggleSelectMode() {
  isSelectMode = !isSelectMode;
}

function render() {  
  updateOutlineMesh();
  renderer.render(scene, camera);
}

function onResize() {
  var WIDTH = container.width(),
      HEIGHT =  window.innerHeight * 0.6;
  $("#color-swatch-wrapper").css("height", parseInt(HEIGHT)+ "px");
  $("#color-person-wrapper").css("height", parseInt(HEIGHT)+ "px");
  camera.aspect = WIDTH/HEIGHT;
  camera.updateProjectionMatrix();
  renderer.setSize(WIDTH, HEIGHT);
  render();
}

function toggleLightHelpers() {
  isLightHelperOn = !isLightHelperOn;
  lightHelpers.forEach(function(lightHelper) {
    lightHelper.visible = isLightHelperOn;
  });
  $( "#toggle_guide_button" ).toggleClass(
    "button-primary", isLightHelperOn == true);
  render();
}

// create a slide bar for each of the spotlights
function populateSlideBars() {
  for (var i = 1; i < 10; i++) {
    $( "#spotlight" + i).append("<input class='mdl-slider " +
      "mdl-js-slider is-upgraded' type='range' id='s" + i + 
      "' min='0' max='100' value='0' " + 
      "oninput='adjustLightIntensity(" + i + ", this.value)' " +
      "onchange='adjustLightIntensity(" + i + ", this.value)'>");
  }
}

// create a color picker palette for each of the spotlights
function populateColorPickers() {
  for (var i = 1; i < 10; i++) {
    $( "#spotlight" + i).append("<i id='palette" + i + 
      "' class='material-icons palette' onClick='openSpotlightControl(" + i + ")'>palette</i>");
    $( "#spotlight" + i).append("<span> Spotlight " + i + " <span id='intensity" + 
      i + "'></span>");
    updateIntensityLabel(i);
  }
}

function populateFilterColors() {
  $("#color-swatch-wrapper").empty();
  leeColors.forEach(function(leeColor) {
    $("#color-swatch-wrapper").append("<i id='L" + leeColor.number + 
      "' class='material-icons md-48' onClick=\"toggleLightColor('" + 
        leeColor.number + "');\">lens</i>");
    $("#L" + leeColor.number).css("color", leeColor.hex);
  });
}


function populatePersonColors() {
  $("#color-person-wrapper").empty();
  peopleColors.forEach(function(peopleColor) {
    $("#color-person-wrapper").append("<i id='L" + peopleColor.number + 
      "' class='material-icons md-48' onClick=\"setPersonColor('" + 
        peopleColor.number + "');\">lens</i>");
    $("#L" + peopleColor.number).css("color", peopleColor.hex);
  });
}

// allows slide bar to adjust light intensity
function adjustLightIntensity(i, value) {
  lightIntensity = value;
  spotlights[i-1].intensity = lightIntensity/100;
  updateIntensityLabel(i);
  render();
}

function openSpotlightControl(i) {
  selectedSpotlightIndex = i;
  $("#spotlight-grid").hide();
  $("#save-cue-button").hide();
  $("#add-person-button").hide();
  $("#person-color").hide();
  $("#selected-color-name").html("");
  $("#color-picker-card").show();
  originalColor = new THREE.Color(spotlights[i-1].color);
  selectedColor = null;
  populateFilterColors();
}

function openPersonControl() {
  $("#spotlight-grid").hide();
  $("#save-cue-button").hide();
  $("#add-person-button").hide();
  $("#color-picker-card").hide();
  $("#selected-color-name").html("");
  $("#person-color").show();
  selectedColor = null;
  populatePersonColors();
}

function hideSpotlightControl() {
  if(!isPickingColor) {
    selectedColor = originalColor;
    setSpotLightColor();
  }
  $("#spotlight-grid").show();
  $("#save-cue-button").show();
  $("#add-person-button").show();
  $("#color-picker-card").hide();
  isPickingColor = false;
}

function hidePersonControl() {
  $("#spotlight-grid").show();
  $("#save-cue-button").show();
  $("#add-person-button").show();
  $("#person-color").hide();
  isPickingColor = false;
}

function toggleLightColor(leeNumber) {
  var leeColor = findLeeColor(leeNumber);
  selectedColor = new THREE.Color(leeColor["hex"]);
  selectedFilter = leeColor["name"];
  $("#selected-color-name").html(" "  + leeColor["name"] + " (L" + leeNumber + ")");
  changeSpotLightColor();
}

function changeSpotLightColor() {
  spotlights[selectedSpotlightIndex-1].color.set(selectedColor);
  lightHelpers[selectedSpotlightIndex-1].children[0].material.color.set(selectedColor);
  render();
}

function setSpotLightColor() {
  if(selectedColor != null) {
    spotlights[selectedSpotlightIndex-1].color.set(selectedColor);
    $("#palette" + selectedSpotlightIndex).css("color", "#" + selectedColor.getHexString());
    lightHelpers[selectedSpotlightIndex-1].children[0].material.color.set(selectedColor);
    render();
    isPickingColor = true;
  }
  hideSpotlightControl();
}


function setPersonColor(personNumber) {
   var peopleColor = findPersonColor(personNumber);
   selectedColor = new THREE.Color(peopleColor["hex"]);
  $("#selected-color-name").html(" "  + peopleColor["name"] + " (L" + personNumber + ")");
  if(peopleColor != null) {
    putSphere(selectedColor);
    render();
    isPickingColor = true;
  }
  hidePersonControl();
}


function updateIntensityLabel(i) {
  $("#intensity" + i).html("(" + parseInt(spotlights[i-1].intensity * 100) + "%)");
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}

function findLeeColor(leeNumber) {
  var theLee;
  for (var i = 0; i < leeColors.length; i++) {
    var leeColor = leeColors[i];
    if (leeNumber == leeColor.number) {
      theLee = leeColor;
      break;
    }
  }
  return theLee;
}

function findPersonColor(personNumber) {
  var theColor;
  for (var i = 0; i < peopleColors.length; i++) {
    var peopleColor = peopleColors[i];
    if (personNumber == peopleColor.number) {
      theColor = peopleColor;
      break;
    }
  }
  return theColor;
}

function saveCue() {
  // for spotlight configuration in the cue object
  var spotlightsDetail = [];

  var peopleDetail = [];

  for (var i=0; i < spotlights.length; i++) {
    var spotlightElement = {};
    spotlightElement["id"] = i+1;
    spotlightElement["color"] = spotlights[i].color.getHexString();
    spotlightElement["intensity"] = spotlights[i].intensity;
    spotlightsDetail.push(spotlightElement);
  }

  for (var i=0; i < people.length; i++) {
    var peopleElement = {};
    peopleElement["id"] = i+1;
    peopleElement["color"] = people[i].material.color.getHexString();
    peopleElement["pos"] = people[i].position;
    peopleDetail.push(peopleElement);
  }

  var newCue = {
    "camera" : {
      "position" : {
        "x" : camera.position.x,
        "y" : camera.position.y,
        "z" : camera.position.z
      },
      "rotation" : {
        "x" : camera.rotation.x,
        "y" : camera.rotation.y,
        "z" : camera.rotation.z
      }
    },
    "spotlights" : spotlightsDetail,
    "people" : peopleDetail
  };

  savedCues.push(newCue);
  localStorage.setItem("cues", JSON.stringify(savedCues));
  loadCues();
}

function loadCues() {
  var cues = JSON.parse(localStorage.getItem("cues"));
  if (cues != null) {
    savedCues = cues;
    $("#saved-cues-wrapper").empty();
    for (var i=0; i < savedCues.length; i++) {
     $("#saved-cues-wrapper").append(
      '<label class="mdl-radio mdl-js-radio mdl-js-ripple-effect" ' + 'for="cue' + i + 
      ' oninput="loadConfiguration(' + i + ');" onchange="loadConfiguration(' + i + ');"><input type="radio" id="cue' + i + 
     '" class="mdl-radio__button" name="cues" value="' + i + 
     '"><span class="mdl-radio__label"> Cue ' + (i+1) + '</span></label>');
    } 
  }
}

function loadConfiguration(i) {
  if (i < savedCues.length) {
    var cueConfiguration = savedCues[i];
    camera.position.set(
      cueConfiguration.camera.position.x,
      cueConfiguration.camera.position.y,
      cueConfiguration.camera.position.z);
    camera.rotation.set(
      cueConfiguration.camera.rotation.x,
      cueConfiguration.camera.rotation.y,
      cueConfiguration.camera.rotation.z
    );

    for (var j = 0; j < cueConfiguration.spotlights.length; j++) {
      spotlights[j].color.set(new THREE.Color("#" + cueConfiguration.spotlights[j].color));
      $("#palette" + (j+1)).css("color", "#" + cueConfiguration.spotlights[j].color);
      lightHelpers[j].children[0].material.color.set(new THREE.Color("#" + cueConfiguration.spotlights[j].color));
      
      spotlights[j].intensity = cueConfiguration.spotlights[j].intensity * 100;
      adjustLightIntensity(j+1, cueConfiguration.spotlights[j].intensity * 100);
      $("#s" + (j+1)).attr("value", parseInt(cueConfiguration.spotlights[j].intensity * 100));
    }

    //updateIntensityLabel();

    for (var j = 0; j < people.length; j++)
    {
      scene.remove(people[j]);
    }

    transformControls.detach();

    people = [];

    for (var j = 0; j < cueConfiguration.people.length; j++) {
      var currPerson = cueConfiguration.people[j];
      var pos = currPerson.pos;
      putSpecificSphere(new THREE.Color("#" + currPerson.color), pos.x, pos.y, pos.z);

    }

    render();
  }
}

function downloadImage() {
  var image = renderer.domElement.toDataURL("image/png");
  window.location.href=image.replace(/^data:image\/[^;]/, 'data:application/octet-stream');
}

function removePerson(person) {
  var index = people.indexOf(person);
  if (index > -1) {
    people.splice(index, 1);
    if (people.length > 0) {
      transformControls.attach(people[0]);
        selectedObject = people[0];
    }
    else
    {
      transformControls.detach();
      selectedObject = null;
    }
  }
  render();
}


window.addEventListener( 'mousemove', onMouseMove, false );
window.addEventListener( 'click', onMouseClick, false );
window.requestAnimationFrame(render);
window.addEventListener( 'keydown', function ( event ) {

          switch ( event.keyCode ) {

            case 81: // Q
             transformControls.setSpace(transformControls.space === "local" ? "world" : "local" );
              break;

            case 17: // Ctrl
             transformControls.setTranslationSnap( 100 );
             transformControls.setRotationSnap( THREE.Math.degToRad( 15 ) );
              break;

            case 87: // W
             transformControls.setMode( "translate" );
              break;

            case 69: // E
             transformControls.setMode( "rotate" );
              break;

            case 82: // Rt
             transformControls.setMode( "scale" );
              break;

            case 187:
            case 107: // +, =, num+
             transformControls.setSize(transformControls.size + 0.1 );
              break;

            case 189:
            case 109: // -, _, num-
             transformControls.setSize( Math.max(transformControls.size - 0.1, 0.1 ) );
              break;

            case 46:
            case 8: //delete, backspace
             scene.remove(selectedObject);
             removePerson(selectedObject);
             render();
              break;

            case 86: // V
             console.log(camera.position);
            break;

          }

        });
  

