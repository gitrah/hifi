//
//  debugFade.js
//  developer/utilities/render
//
//  Olivier Prat, created on 30/04/2017.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

// Set up the qml ui
var qml = Script.resolvePath('fade.qml');
var window = new OverlayWindow({
    title: 'Fade',
    source: qml,
    width: 500, 
    height: 900
});
window.setPosition(50, 50);
window.closed.connect(function() { Script.stop(); });
Render.getConfig("RenderMainView.DrawFadedOpaqueBounds").enabled = true