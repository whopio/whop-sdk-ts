#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROTOS_DIR=$SCRIPT_DIR/../protos/
CURRENT_DIR=$(pwd)
cd $SCRIPT_DIR/../

rm -rf protos/
mkdir protos
./scripts/sparse_checkout.sh https://github.com/whopio/whop-proto.git main protos -- protos/

cd $CURRENT_DIR
