#!/bin/bash
solana-test-validator \
  --reset \
  --bpf-program J39RNWHB4Tc4utSGSE8fnmyLngMtYR6A2Mrz4j1hFirQ ../target/deploy/coinpetitive.so \
  --quiet