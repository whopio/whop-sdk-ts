#!/bin/bash
echo "Generating typescript from protos..."

rm -rf ./src/codegen/proto
mkdir -p ./src/codegen/proto

PROTO_FILES=$(find ../../protos/protos \
  -name "*.proto" \
  ! -name "profiler.proto" \
  ! -name "data_platform.proto")

protoc \
  --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./src/codegen/proto \
  --proto_path=../../protos/protos \
  --ts_proto_opt=onlyTypes=true \
  --ts_proto_opt=useJsonWireFormat=true \
  --ts_proto_opt=snakeToCamel=false \
  --ts_proto_opt=env=browser \
  --ts_proto_opt=outputIndex=true \
  --ts_proto_opt=stringEnums=true \
  --ts_proto_opt=enumsAsLiterals=true \
  $PROTO_FILES

printf '\n ✔︎ Generated typescript from protos successfully ✔︎\n\n'