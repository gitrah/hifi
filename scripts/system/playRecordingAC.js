"use strict";

//
//  playRecordingAC.js
//
//  Created by David Rowe on 7 Apr 2017.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function () {

    var APP_NAME = "PLAYBACK",
        HIFI_RECORDER_CHANNEL = "HiFi-Recorder-Channel",
        HIFI_PLAYER_CHANNEL = "HiFi-Player-Channel",
        PLAYER_COMMAND_PLAY = "play",
        PLAYER_COMMAND_STOP = "stop",
        heartbeatTimer = null,
        HEARTBEAT_INTERVAL = 3000,  // TODO: Final value.
        TIMESTAMP_UPDATE_INTERVAL = 2500,  // TODO: Final value.
        AUTOPLAY_SEARCH_INTERVAL = 5000,  // TODO: Final value.
        scriptUUID,

        Entity,
        Player;

    function log(message) {
        print(APP_NAME + " " + scriptUUID + ": " + message);
    }

    Entity = (function () {
        // Persistence of playback via invisible entity.
        var entityID = null,
            userData,
            updateTimestampTimer = null,
            ENTITY_NAME = "Recording",
            ENTITY_DESCRIPTION = "Avatar recording to play back",
            ENTITIY_POSITION = { x: -16382, y: -16382, z: -16382 },  // Near but not right on domain corner.
            ENTITY_SEARCH_DELTA = { x: 1, y: 1, z: 1 },  // Allow for position imprecision.
            isClaiming = false,
            CLAIM_CHECKS = 2,
            claimCheckCount;

        function onUpdateTimestamp() {
            userData.timestamp = Date.now();
            Entities.editEntity(entityID, { userData: JSON.stringify(userData) });
            EntityViewer.queryOctree();  // Keep up to date ready for find().
        }

        function create(filename, position, orientation, scriptUUID) {
            // Create a new persistence entity (even if already have one but that should never occur).
            var properties;

            log("Create recording " + filename);

            if (updateTimestampTimer !== null) {
                Script.clearInterval(updateTimestampTimer);  // Just in case.
            }

            userData = {
                recording: filename,
                position: position,
                orientation: orientation,
                scriptUUID: scriptUUID,
                timestamp: Date.now()
            };

            properties = {
                type: "Box",
                name: ENTITY_NAME,
                description: ENTITY_DESCRIPTION,
                position: ENTITIY_POSITION,
                visible: false,
                userData: JSON.stringify(userData)
            };

            entityID = Entities.addEntity(properties);
            if (!Uuid.isNull(entityID)) {
                updateTimestampTimer = Script.setInterval(onUpdateTimestamp, TIMESTAMP_UPDATE_INTERVAL);
                return true;
            }

            return false;
        }

        function find(scriptUUID) {
            // Find a recording that isn't being played.
            // AC scripts may simultaneously find the same entity to play because octree updates are not instantaneously 
            // propagated to AC scripts. To address this, when an entity is found an AC script updates the entity data to 
            // "claim" the entity then waits two find() calls before checking the entity data hasn't changed and returning that 
            // entity as "found". I.e., the last script to write the entity data wins.
            var isFound = false,
                entityIDs,
                index,
                properties;

            // If have putatively claimed an entity, handle that claim.
            if (isClaiming) {
                claimCheckCount += 1;

                // Wait for octree updates to propagate.
                if (claimCheckCount <= CLAIM_CHECKS) {
                    EntityViewer.queryOctree();  // Update octree ready for next find() call.
                    return null;
                }
                isClaiming = false;

                // Complete claim as "found" if still valid.
                properties = Entities.getEntityProperties(entityID, ["userData"]);
                userData = JSON.parse(properties.userData);
                if (userData.scriptUUID === scriptUUID) {
                    log("Complete claim " + entityID);
                    userData.timestamp = Date.now();
                    Entities.editEntity(entityID, { userData: JSON.stringify(userData) });
                    EntityViewer.queryOctree();  // Update octree ready for next find() call.
                    updateTimestampTimer = Script.setInterval(onUpdateTimestamp, TIMESTAMP_UPDATE_INTERVAL);
                    return { recording: userData.recording, position: userData.position, orientation: userData.orientation };
                }

                // Otherwise resume searching.
                log("Release claim " + entityID);
                EntityViewer.queryOctree();  // Update octree ready for next find() call.
                return null;
            }

            // Find an entity to claim.
            entityIDs = Entities.findEntities(ENTITIY_POSITION, ENTITY_SEARCH_DELTA.x);
            if (entityIDs.length > 0) {
                index = -1;
                while (!isFound && index < entityIDs.length - 1) {
                    // Find recording that isn't being played and hasn't been claimed.
                    index += 1;
                    properties = Entities.getEntityProperties(entityIDs[index], ["name", "userData"]);
                    if (properties.name === ENTITY_NAME) {
                        userData = JSON.parse(properties.userData);
                        isFound = (Date.now() - userData.timestamp) > ((CLAIM_CHECKS + 1) * AUTOPLAY_SEARCH_INTERVAL);
                    }
                }
            }

            // Claim entity if found.
            if (isFound) {
                log("Claim entity " + entityIDs[index]);
                isClaiming = true;
                claimCheckCount = 0;
                entityID = entityIDs[index];
                userData.scriptUUID = scriptUUID;
                userData.timestamp = Date.now();
                Entities.editEntity(entityID, { userData: JSON.stringify(userData) });
            }

            EntityViewer.queryOctree();  // Update octree ready for next find() call.
            return null;
        }

        function destroy() {
            // Delete current persistence entity.
            if (entityID !== null) {  // Just in case.
                Entities.deleteEntity(entityID);
                entityID = null;
            }
            if (updateTimestampTimer !== null) {  // Just in case.
                Script.clearInterval(updateTimestampTimer);
            }
        }

        function setUp() {
            // Set up EntityViewer so that can do Entities.findEntities().
            // Position and orientation set so that viewing entities only in corner of domain.
            var entityViewerPosition = Vec3.sum(ENTITIY_POSITION, ENTITY_SEARCH_DELTA);
            EntityViewer.setPosition(entityViewerPosition);
            EntityViewer.setOrientation(Quat.lookAtSimple(entityViewerPosition, ENTITIY_POSITION));
            EntityViewer.queryOctree();
        }

        function tearDown() {
            // Nothing to do.
        }

        return {
            create: create,
            find: find,
            destroy: destroy,
            setUp: setUp,
            tearDown: tearDown
        };
    }());

    Player = (function () {
        // Recording playback functions.
        var isPlayingRecording = false,
            recordingFilename = "",
            autoPlayTimer = null;

        function playRecording(recording, position, orientation) {
            Agent.isAvatar = true;
            Avatar.position = position;
            Avatar.orientation = orientation;

            Recording.loadRecording(recording);
            Recording.setPlayFromCurrentLocation(true);
            Recording.setPlayerUseDisplayName(true);
            Recording.setPlayerUseHeadModel(false);
            Recording.setPlayerUseAttachments(true);
            Recording.setPlayerLoop(true);
            Recording.setPlayerUseSkeletonModel(true);

            Recording.setPlayerTime(0.0);
            Recording.startPlaying();
        }

        function play(recording, position, orientation) {
            if (Entity.create(recording, position, orientation, scriptUUID)) {
                log("Play new recording " + recordingFilename);
                isPlayingRecording = true;
                recordingFilename = recording;
                playRecording(recordingFilename, position, orientation);
            } else {
                log("Could not create entity to play new recording " + recordingFilename);
            }
        }

        function autoPlay() {
            var recording;

            recording = Entity.find(scriptUUID);
            if (recording) {
                isPlayingRecording = true;
                recordingFilename = recording.recording;

                log("Play persisted recording " + recordingFilename);

                playRecording(recording.recording, recording.position, recording.orientation);
            } else {
                autoPlayTimer = Script.setTimeout(autoPlay, AUTOPLAY_SEARCH_INTERVAL);  // Try again soon.
            }
        }

        function stop() {
            log("Stop playing " + recordingFilename);

            Entity.destroy();

            if (Recording.isPlaying()) {
                Recording.stopPlaying();
                Agent.isAvatar = false;
            }
            isPlayingRecording = false;
            recordingFilename = "";
        }

        function isPlaying() {
            return isPlayingRecording;
        }

        function recording() {
            return recordingFilename;
        }

        function setUp() {
            Entity.setUp();
        }

        function tearDown() {
            if (autoPlayTimer) {
                Script.clearTimeout(autoPlayTimer);
                autoPlayTimer = null;
            }
            Entity.tearDown();
        }

        return {
            autoPlay: autoPlay,
            play: play,
            stop: stop,
            isPlaying: isPlaying,
            recording: recording,
            setUp: setUp,
            tearDown: tearDown
        };
    }());

    function sendHeartbeat() {
        Messages.sendMessage(HIFI_RECORDER_CHANNEL, JSON.stringify({
            playing: Player.isPlaying(),
            recording: Player.recording()
        }));
        heartbeatTimer = Script.setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL);
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            Script.clearTimeout(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    function onMessageReceived(channel, message, sender) {
        message = JSON.parse(message);
        if (message.player === scriptUUID) {
            switch (message.command) {
            case PLAYER_COMMAND_PLAY:
                if (!Player.isPlaying()) {
                    Player.play(message.recording, message.position, message.orientation);
                } else {
                    log("Didn't start playing " + message.recording + " because already playing " + Player.recording());
                }
                sendHeartbeat();
                break;
            case PLAYER_COMMAND_STOP:
                Player.stop();
                Player.autoPlay();  // There may be another recording to play.
                sendHeartbeat();
                break;
            }
        }
    }

    function setUp() {
        scriptUUID = Agent.sessionUUID;

        Player.setUp();

        Messages.messageReceived.connect(onMessageReceived);
        Messages.subscribe(HIFI_PLAYER_CHANNEL);

        Player.autoPlay();
        sendHeartbeat();
    }

    function tearDown() {
        stopHeartbeat();
        Player.stop();

        Messages.messageReceived.disconnect(onMessageReceived);
        Messages.unsubscribe(HIFI_PLAYER_CHANNEL);

        Player.tearDown();
    }

    setUp();
    Script.scriptEnding.connect(tearDown);

}());
