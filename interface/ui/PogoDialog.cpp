//
//  PogoDialog.cpp
//  interface/src
//     dialog box that display on jump action
//
//  Created by Potential Newguy on 5 May 2018.
//  Copyright 2018 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html

#include "PogoDialog.h"

#include <QCoreApplication>
#include <QDialog>
#include <QDialogButtonBox>
#include <QFile>
#include <QLabel>
#include <PathUtils.h>
#include <QRadioButton>
#include <QStandardPaths>
#include <QVBoxLayout>
#include <QtCore/QUrl>

#include "../Application.h"
#include "../Menu.h"

#include <RunningMarker.h>
#include <SettingHandle.h>
#include <SettingHelpers.h>


void PogoDialog::announcePogo() {
    QDialog pogoDialog;
    QLabel* label;
    pogoDialog.setWindowTitle(PogoDialogDialog::PogoTitle);
    label = new QLabel(PogoDialogDialog::PogoLabel);

    QVBoxLayout* layout = new QVBoxLayout;

    layout->addWidget(label);

    layout->addSpacing(12);
    layout->addStretch();

    QDialogButtonBox* buttons = new QDialogButtonBox(QDialogButtonBox::Ok);
    layout->addWidget(buttons);
    pogoDialog.connect(buttons, SIGNAL(accepted()), SLOT(accept()));

    pogoDialog.setLayout(layout);

    int result = pogoDialog.exec();

    // Dialog cancelled or "do nothing" option chosen
}


