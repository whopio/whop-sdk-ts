#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROTOS_DIR=$SCRIPT_DIR/../protos/
CURRENT_DIR=$(pwd)
cd $SCRIPT_DIR/../

rm -rf protos/
mkdir protos
if [ -n "$GITHUB_TOKEN" ]; then
   echo "Using token: ${GITHUB_TOKEN:0:15}"
	./scripts/sparse_checkout.sh "https://${GITHUB_TOKEN}@github.com/whopio/whop-proto.git" main protos -- protos/
else
	echo "Not using token"
	./scripts/sparse_checkout.sh "https://github.com/whopio/whop-proto.git" main protos -- protos/
fi

cd $CURRENT_DIR
