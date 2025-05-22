#!/bin/bash
echo "Downloading protos..."

./scripts/sparse_checkout.sh ../../protos/protos/

if [ $? -eq 0 ]; then
  printf '\n ✔︎ Downloaded protos successfully ✔︎\n\n'
else
  printf '\n ❌ Failed to download protos ❌\n\n'
  exit 1
fi

echo "Generating typescript from protos..."

rm -rf ./src/codegen/proto
mkdir -p ./src/codegen/proto

PROTO_FILES=$(find ../../protos/protos \
  -name "*.proto" \
  ! -name "profiler.proto" \
  ! -name "data_platform.proto")

pnpm protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./src/codegen/proto \
  --proto_path=../../protos/protos \
  --ts_proto_opt=onlyTypes=true \
  --ts_proto_opt=useJsonWireFormat=true \
  --ts_proto_opt=snakeToCamel=true \
  --ts_proto_opt=env=browser \
  --ts_proto_opt=outputIndex=true \
  --ts_proto_opt=stringEnums=true \
  --ts_proto_opt=enumsAsLiterals=true \
  $PROTO_FILES

if [ $? -eq 0 ]; then
  printf '\n ✔︎ Generated typescript from protos successfully ✔︎\n\n'
else
  printf '\n ❌ Failed to generate typescript from protos ❌\n\n'
  exit 1
fi