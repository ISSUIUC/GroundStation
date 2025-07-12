# GSS 2.1

## Startup
To get started, first install [Docker Desktop](https://www.docker.com/products/docker-desktop/) to install both Docker and Docker-compose. (Alternatively you can system install them independently.)

To run the entire groundstation, run the following command:

```bash
docker-compose -f compose.yml up --build
```

This will build and deploy the groundstation locally. Once all containers are built you can check the status on your [Local host](http://localhost/)

This command can also be deployed with `./run.sh`.


## Documentation
The [GSS v2.1 handbook and reference](https://docs.google.com/document/d/1eRebK1CFbggOo4eJAiKjgc4_sMrgrA7l35v7i22xEpk/edit?tab=t.0#heading=h.3fbfvvgovwol) (unfinished) contains documentation for the entire system.



## Undocumented components, here temporarily:

### mqtt weirdness
using non-standard port 1884 because 1883 conflicts with existing installs of like emqx and mosquitto

ws packet structure:

```json

{
    "metadata": {
        "raw_stream": "FlightData-Sustainer",
        "interpret_as": "sustainer", // valid values: "sustainer", "booster", "common"
        "time_published": ...,
        "time_recieved": ...,
    },
    "data": {
        // packet payload here
    }
}

```

tx packet:

```json
{
    "metadata": {
        "sent_to": "sustainer",
        "sent_time": ...
    },
    "data": {
        // payload here
    }
}
```


### config.ini:
config.ini has shared configs between multiple containers and is mounted as a volume in relevant locations (root for backend, /public for frontend)

Config fields prefixed with `Telemetry:` (like `Telemetry:sustainer` define a single "telemetry channel" (a pair of data/control channels for a single data source, think: one stage of a rocket))

