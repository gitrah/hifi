//
//  Audio.h
//  interface/src/scripting
//
//  Created by Zach Pomerantz on 28/5/2017.
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#ifndef hifi_scripting_Audio_h
#define hifi_scripting_Audio_h

#include "AudioScriptingInterface.h"
#include "AudioDevices.h"

namespace scripting {

class Audio : public AudioScriptingInterface {
    Q_OBJECT
    SINGLETON_DEPENDENCY

    // TODO: Q_PROPERTY(bool mute)
    // TODO: Q_PROPERTY(bool noiseReduction)
    // TODO: Q_PROPERTY(bool reverb)
    // TODO: Q_PROPERTY(float inputVolume)
    // TODO: Q_PROPERTY(bool showMicLevel)
    // TODO: Q_PROPERTY(QString context)
    Q_PROPERTY(AudioDevices* devices READ getDevices NOTIFY nop)

public:
    virtual ~Audio() {}

signals:
    void nop();

protected:
    Audio() {}

private:
    AudioDevices* getDevices() { return &_devices; }
    AudioDevices _devices;
};

};

#endif // hifi_scripting_Audio_h
