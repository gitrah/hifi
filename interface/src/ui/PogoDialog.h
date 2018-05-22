//
//  PogoDialog.h
//  interface/src
//     dialog box that display on pogo action
//
//  Created by Potential Newguy on 5 May 2015.
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

#pragma once

#include <QString>

class PogoDialog {

public:

    static void announcePogo();
};

namespace PogoDialogDialog {
    const QString PogoTitle = "Pogo!";
    const QString PogoLabel = "Watch this move!";
}
