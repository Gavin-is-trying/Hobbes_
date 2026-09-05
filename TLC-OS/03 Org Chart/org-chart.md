## Organization Chart

```mermaid
flowchart TD
    A["Owner/Visonary — Gavin"]
    B["Integrator — Gavin"]

    subgraph AA["Admin"]
        direction TB
        C["People Manager"]
        hiringOwner["Hiring Owner"]
        onboardingOwner["Onboarding Owner"]

        C --> hiringOwner
        C --> onboardingOwner
    end

    subgraph BB["Operations"]
        direction TB
        D["Crew Leader"]
        l["L"]
        e["E"]

        D --> l
        D --> e

    end

   subgraph CC["Leads"]
        direction TB
        E["Sale Manager"]
        leadIntakeOwner["Lead Intake Owner"]
        estimator["Estimator"]

        E --> leadIntakeOwner
        E --> estimator
    end


    A --> B
    B --> C
    B --> D
    B --> E
```
