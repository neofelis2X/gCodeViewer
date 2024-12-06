/**
 * User: hudbrog (hudbrog@gmail.com)
 * Date: 10/21/12
 * Time: 4:59 PM
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

GCODE.renderer3d = (function(){
	// ***** PRIVATE ******
	THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);
	var modelLoaded=false;
	var model = [];
	var prevX=0, prevY= 0, prevZ=0;
	var sliderHor, sliderVer;
	var object;
	var geometry;

	var WIDTH = 650, HEIGHT = 630;
	var VIEW_ANGLE = 60,
		ASPECT = WIDTH / HEIGHT,
		NEAR = 0.1,
		FAR = 10000;

	var renderer;
	var scene;
	var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
	var controls;
	const bgcolour = new THREE.Color().setHex( 0xf4f4f4 );
	var halfWidth = window.innerWidth / 2;
	var halfHeight = window.innerHeight / 2;
	var mouseX = 0, mouseY = 0;

	var renderOptions = {
		showMoves: true,
		colorLine: 0x000000,
		colorMove: 0x00ff00,
		rendererType: "webgl"
	};

	var render = function(){
		requestAnimationFrame(render);
		controls.update();
		renderer.render(scene, camera);
	};

	var buildModelIteration = function(layerNum, pts){
		var j;
		var cmds  = model[layerNum];
		if(!cmds)return;
		for(j=0;j<cmds.length;j++){
			if(!cmds[j])continue;
			if(isNaN(cmds[j].x))cmds[j].x=prevX;
			if(isNaN(cmds[j].y))cmds[j].y=prevY;
			if(isNaN(cmds[j].z))cmds[j].z=prevZ;
			if(!cmds[j].extrude){
			}
			else {
				pts.push( new THREE.Vector3( prevX, prevY, prevZ ) );
				pts.push( new THREE.Vector3( cmds[j].x, cmds[j].y, cmds[j].z ) );
			}
			prevX = cmds[j].x;
			prevY = cmds[j].y;
			prevZ = cmds[j].z;
		};
		return pts
	};

	var buildModelIteratively = function(){
		var i;
		var points = [];

		for( i=0; i<model.length; i+=1 ){
			points = buildModelIteration( i, points );
			//TODO: need to remove UI stuff from here

		}
		geometry.setFromPoints( points );
		const lineMaterial = new THREE.LineBasicMaterial({color: renderOptions["colorLine"], linewidth: 2, opacity: 0.6, fog: false});
		geometry.computeBoundingBox();
		object.add(new THREE.Line(geometry, lineMaterial, THREE.LinePieces));
		const center = new THREE.Vector3().add( geometry.boundingBox.min ).add( geometry.boundingBox.max ).divideScalar( 2.0 ).multiplyScalar( -1);
		object.position.set( center.x, center.y, 0.0 );

	}

	var buildModel = function(){
		var i,j;
		var cmds = [];

		for( i=0; i<model.length; i++ ){
			cmds = model[i];
			if(!cmds)continue;
			const points = [];
			for(j=0;j<cmds.length;j++){
				if(!cmds[j])continue;
				if(!cmds[j].x)cmds[j].x=prevX;
				if(!cmds[j].y)cmds[j].y=prevY;
				if(!cmds[j].z)cmds[j].z=prevZ;
				if(!cmds[j].extrude){
				}
				else {
					points.push( new THREE.Vector3( prevX, prevY, prevZ ) );
					points.push( new THREE.Vector3( cmds[j].x, cmds[j].y, cmds[j].z ) );
				}
				prevX = cmds[j].x;
				prevY = cmds[j].y;
				prevZ = cmds[j].z;
			}
			geometry.setFromPoints( points );
			//TODO: need to remove UI stuff from here
			$(function() {
				$( "#progressbar" ).progressbar({
					value: i/model.length*100
				});
			});

		}
		var lineMaterial = new THREE.LineBasicMaterial({color: renderOptions["colorLine"], linewidth: 4, opacity: 1, fog: false});
		geometry.computeBoundingBox();
		object.add(new THREE.Line(geometry, lineMaterial, THREE.LinePieces));
		const center = new THREE.Vector3().add( geometry.boundingBox.min ).add( geometry.boundingBox.max ).divideScalar( 2.0 ).multiplyScalar( -1);
		object.position.set( center.x, center.y, 0.0 );
	};

	var debugAxis = function(axisLength){
		//Shorten the vertex function
		function v(x,y,z){
			return new THREE.Vector3(x,y,z);
		}

		//Create axis (point1, point2, colour)
		function createAxis(p1, p2, color){
			const lineGeometry = new THREE.BufferGeometry();
			const lineMat = new THREE.LineBasicMaterial({color: color, linewidth: 1});
			const points = [];
			points.push( p1 );
			points.push( p2 );
			lineGeometry.setFromPoints( points );

			const line = new THREE.Line(lineGeometry, lineMat);
			scene.add(line);
		}

		createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
		createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
		createAxis(v(0, 0, -axisLength / 10), v(0, 0, axisLength), 0x0000FF);
	};


	// ***** PUBLIC *******
	return {
		init: function(){
			modelLoaded = false;

			if(renderOptions["rendererType"]=="webgl")renderer = new THREE.WebGLRenderer( { antialias: true } );

			else if(renderOptions["rendererType"]=="canvas")renderer = new THREE.CanvasRenderer( { antialias: true } );

			else { console.log("unknown rendererType"); return;}

			scene = new THREE.Scene()
			var $container = $('#3d_container');
			scene.add(camera);
			renderer.setClearColor( bgcolour, 1.0 );
			renderer.setSize(WIDTH, HEIGHT);
			$container.empty();
			$container.append(renderer.domElement);

			// controls
			controls = new OrbitControls( camera, renderer.domElement );

			// an animation loop is required when either damping or auto-rotation are enabled
			controls.enableDamping = true;
			controls.dampingFactor = 0.05;
			controls.screenSpacePanning = false;

			controls.minDistance = 20;
			controls.maxDistance = 800;
			controls.rotateSpeed = 0.7;
			controls.zoomSpeed = 1.2;
			controls.panSpeed = 1.0;

			controls.noZoom = false;
			controls.noPan = false;

			controls.staticMoving = true;
			controls.dynamicDampingFactor = 0.2;

			controls.keys = [ 65, 83, 68 ];
			camera.position.set(75, -100, 150);
			controls.update();

		},
		isModelReady: function(){
			return modelLoaded;
		},
		setOption: function(options){
			for(var opt in options){
				if(options.hasOwnProperty(opt))renderOptions[opt] = options[opt];
			}
		},
		setModel: function(mdl){
			model = mdl;
			modelLoaded = false;
		},
		doRender: function(){
			prevX=0;
			prevY=0;
			prevZ=0;
			object = new THREE.Object3D();
			geometry = new THREE.BufferGeometry();
			this.init();
			if(model)modelLoaded=true;
			else return;
			// buildModel();
			buildModelIteratively();

			scene.add(object);
			debugAxis(80);

			var mousemove = function(e){
				mouseX = e.clientX - halfWidth;
				mouseY = e.clientY - halfHeight;
			};
			// Action!
			render();
		}
	}
}());

