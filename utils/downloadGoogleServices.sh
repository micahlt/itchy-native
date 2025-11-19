#!/bin/bash

echo $GOOGLE_SERVICES_JSON_BASE64 | base64 --decode > ./google-services.json
echo $GOOGLE_SERVICES_PLIST_BASE64 | base64 --decode > ./GoogleService-Info.plist
cp ./GoogleService-info.plist $EAS_BUILD_WORKINGDIR/GoogleService-Info.plist
echo "Copied Google Services to working directory:"
echo $EAS_BUILD_WORKINGDIR